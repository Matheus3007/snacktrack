# SnackTrack

#### (Or a slightly schizo way of figuring if there's a midnight scnacker at the office)

## What's this

Weird repo title, I know. Last week (as of writing this), my co-workers started noticing that the contents of the snack locker at the office would misteriously vanish overnight sometimes, which was weird since the office was mostly empty (at least of people who were supposed to be snacking at the locker) in the hours it'd happen. Even worse, the amount of things that would disappear were too big for even three people to eat by themselves in such a short span of time.

This caused us to ponder, could there be foul-play involved? Well, maybe, but there are no cameras on the locker and just accusing is something awful to do, so I took the weekend to develop something to help us investigate, and so came to life our beloved **SnackTrack**

## How it works

The system's comprised of three main actors, a dashboard (hosted free on [render](render.com)), a database (hosted free on [supabase](https://supabase.com/)), and a sensor (hosted free on an ESP32-C super mini).

### Frontend

The frontend folder contains the Vite app that generates the dashboard, it's very simple and aims only to act as a clean, easy to access interface to our database, which in of itself contains only three columns, an ID, a timestamp of row creation, and a event delimeter (opened or closed)

### Backend

The backend in this repo are only the relevants routes to talk to the actual DB that's running on supabase. They are very simple and it's only purpose was isolating the calls to the actual DB to make it kinda safer (not that anyone will tamper with it), since cramming everything into a static html.index, although simple and effective, would expose both my DB's URL and it's keys.

### Embbedded

The embedded is the bread and butter of the project and the reason I wanted to do it at first. It's far from energy efficient, but it works well enough. For now, it's an ultrasonic sensor that keeps measuring the (left) door distance from it every .25 seconds, if it's different from what it measured as an average during startup (different -> 10cm over that), it considers the door open and signals the DB, then, if in an open state, it becomes closed, the DB also receives a call. Nice to point out that it doesn't keep telling it's closed, it only messages on state changes.

## Why?

In short, because I have far too much free time. I don't expect to catch the culprit red-handed, actually, I expect to find out that there's no culprit in fact, but you never know. Basically, the only guarantee is that we'll have some cool data, in fact, we already have! Did you know that on average, it takes 7 seconds for someone to grab a little snack and leave?
