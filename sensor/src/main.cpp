#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

#define LED_PIN 8
#define TRIG_PIN 2
#define ECHO_PIN 3

const char* ssid = "Guest";
const char* password = "BrokenWires@@2019";

const char* supabaseUrl = "https://pjibitcgmkqhdydtaodh.supabase.co";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqaWJpdGNnbWtxaGR5ZHRhb2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNTYyNDQsImV4cCI6MjA3NTgzMjI0NH0.9XftP37pvmw1frxi8vjypiHDTzqH2X2QNNlLAF-VnQ0";

float baselineDistance = 0;
bool doorWasOpen = false;
const float THRESHOLD = 10.0; // cm - adjust based on your setup

void blinkPattern(int times, int delayMs) {
  for(int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
  }
  delay(500);
}

float getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(80);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(80);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  if (duration == 0) return -1; // No echo
  
  float distance = duration * 0.034 / 2; // Speed of sound
  return distance;
}

void logEvent(String eventType) {
  if (WiFi.status() != WL_CONNECTED) {
    blinkPattern(10, 50);
    return;
  }
  
  HTTPClient http;
  
  String url = String(supabaseUrl) + "/rest/v1/door_events";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);
  http.addHeader("Prefer", "return=minimal");
  
  String payload = "{\"event_type\":\"" + eventType + "\"}";
  
  int httpResponseCode = http.POST(payload);
  http.end();
  
  if (httpResponseCode == 201 || httpResponseCode == 200) {
    Serial.println("Success post");
  //  digitalWrite(LED_PIN, HIGH);
  //  delay(800);
  //  digitalWrite(LED_PIN, LOW);
  } else {
    Serial.println("Fail post");
  //  blinkPattern(5, 100);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  blinkPattern(10, 250);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    blinkPattern(3, 300);
    
    // Calibrate baseline - take average of 5 readings
    float total = 0;
    int validReadings = 0;
    for (int i = 0; i < 5; i++) {
      float dist = getDistance();
      if (dist > 0) {
        total += dist;
        validReadings++;
      }
      delay(200);
    }
    
    if (validReadings > 0) {
      baselineDistance = total / validReadings;
      //blinkPattern(2, 200); // Calibration done
    } else {
      //blinkPattern(10, 100); // Calibration failed
    }
  } else {
    //blinkPattern(10, 100);
  }
}

void loop() {
  float distance = getDistance();
  
  if (distance < 0) {
    delay(80);
    return; // Bad reading, skip
  }
  
  bool doorIsOpen = (distance > baselineDistance + THRESHOLD);
  
  // Door state changed
  if (doorIsOpen && !doorWasOpen) {
    Serial.println("logged open");
    logEvent("opened");
    doorWasOpen = true;
  } else if (!doorIsOpen && doorWasOpen) {
    Serial.println("logged closed");
    logEvent("closed");
    doorWasOpen = false;
  }
  
  delay(250); // Check every 0.5 seconds
}