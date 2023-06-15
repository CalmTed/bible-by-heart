Bible by heart
---

Another app for learning Bible passages but with some personalization

Whats different from analogus apps:
---

- stroke counter 
- address learning tests for black box learning method
- ukrainian interface language (add your if you want)
- customizable Bible translation
- fully offline and free (syncying options might be paid in future to support work)

Whats the same:
---

- passages list(add, remove, edit)
- reminders notification
- difficulty levels

Roadmap
---

- [x] asyncly get local storage
- [x] navigation, state management
- [x] interface l10n support
- [x] list manipulation (add, remove, edit, archive, search, filter)
  - [x] address selector
  - [x] add, remove
  - [x] edit text, set tag(archive)
  - [x] search (text, address, tag)
  - [x] filter any parameter array (address, catagory, selectedLevel)
  - [x] sorting
  - [x] edit address
- [x] address testing view (generate tests, get answers, float wrong answers to the end, result screen) v0.0.4
- [x] more levels, open level by learning, level select v0.0.5
  - [x] l1, l2, progressing, level switcher
  - [x] l3, l4, l5
- [x] save stats (tests result, stroke, weekly progress) v0.0.6
  - [x] stroke counter
  - [x] weekly progress
- [ ] settings v0.0.7
  - [+] level 3 fix(sort,skip button, save right words)
  - [+] show wrong answer (l1, l2, l4, l5)
  - [ ] settings layout (app/user settings)
  - [ ] app settings: language, reminders(enabled, auto, same time, list), theme, haptic, about, legal, feedback, devmode, train modes, compress old stats(>3month), leftSwipeTag
  - [ ] user settings:  translations array(and default one), name, email, timezone, sessions, request data removal, remove local data
  - [ ] adding passages from prepared list in the most popular translations(ESV,UBT)
    - [ ] copyright page in settings
    - [ ] limit length to 500 verses per passage
  - [ ] edit passage translation (custom with autocomplete from other passages data)
  - [ ] filter by translation (if there are several different)
  - [ ] state converter from v0.0.6
- [ ] customizable daily reminder, more stats v0.0.8
  - [ ] different modes (fast, infinite/timed, all due to, hardest/most errored) & modes customazation(name, sort, tags, included/excluded)
  - [ ] export to csv, import from share(parse), or from other data types
  - [ ] all tests list, grouping by date and session
  - [ ] statistics:
    - [ ] overal learned
    - [ ] global progress (learned passages score versesNumber*level)
    - [ ] relative progress (score relative to last month)
    - [ ] show different stats on home screen
      - [ ] stroke first two weeks
      - [ ] general progress 2 weeks to 1 month
      - [ ] relative progress is more then 1 month, exept round numbers of other stats:1 year stroke or 100 verses learned...
      - different finish screen label: presistent learner, perfect tester(no errors), error buster(a lot of errors), grower(some maxLavel updates)
- [ ] register and login (confirm email or google/facebook login) v0.0.9
  - [ ] feedback form for authorirized users
  - [ ] change data safety settings and privacy pilicy
- [ ] sync + custom sync(without need for registration) v1.0.0
  - [ ] custom sync and documentation web page for it
  - [ ] about page and donate button

Other ideas:
- show most common errors for the given passage
- accomplishments
- friends feature / feed
- groups functionality(group stats, group passages, group quests)
 
Dev. rules
---
1. use setState(reduce()) for state manupulation don't use just useState()
2. use navigateWithState for screen changing dont use just navigate EXEPT goback
3. use createT(langCode) and t(word) for l10n dont use unlocalized text in UI

Using
---
*Installing requirements:*
-  android sdk
- expo tools and packages from package.json

*Running:*
- run `npm start` to start expo (a - run on android, r - reload...)

*Building:*
- `eas build --platform android --profile [preview | production]` to build apk(preview) or aab(production) file (need expo eas account)