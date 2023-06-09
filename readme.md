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
  - [x] level 3 fix(sort,skip button, save right words)
  - [x] show wrong answer (l1, l2, l4, l5)
  - [x] state converter from v0.0.6 to v0.0.7
  - [x] settings layout (app/user settings)
    - [x] components: top user data
    - [x] settings menu item
      - [x] checkbox
      - [x] select
      - [x] open modal
    - [x] settings modal
      - [x] menu list 
      - [x] just text
      - [x] items list
  - [x] app settings: - [x] language, (later)reminders(enabled, auto, same time, list), - [x] theme, - [x] haptic, - [x]  about, - [x] legal, (later)feedback, - [x] devmode, (later) train modes, (later) compress old stats(>3month), - [x] leftSwipeTag
  - [x] user settings:  - [x] translations array(and default one), (!change with API not localy: name, email), (!we have phone local)timezone, (! stored on server sessions), (later) request data removal, (later) remove local data
  - [x] edit passage translation (custom with autocomplete from other passages data)
  - [x] filter by translation (if there are several different)
  - [x] adding passages from prepared list in the most popular translations(ESV,UBT)
    - [x] copyright page in settings
    - [x] limit length to 500 verses per passage
  - [x] delete tests history after deleting passage
  - [x] update all passages with translation that was deleted to "other/null" 
  - [x] add tag to filter on adding to passage, remove if it was last
  - [x] change dateStarted/finished to array, update converter accordinly, set weekly graph to show time spent
- [ ] customizable daily reminder, more stats v0.0.8
  - [x] reminders list: time, days
  - [ ] fix reminders permisions, fix back swipe state eracing fix all tests enabled bug
  - [ ] different train modes (fast, infinite/timed, all due to, hardest/most errored) & modes customazation(name, sort, tags, included/excluded)
  - [ ] edit passage due to, sort main train mode by it
  - [ ] export to csv, import from share(parse), or from other data types
  - [ ] all tests list, grouping by date and session
  - [ ] statistics:
    - [ ] overal learned
    - [ ] global progress (learned passages score versesNumber*level)
    - [ ] relative progress (score relative to last month)
    - [ ] show different stats on home screen
      - [ ] stroke first two weeks
      - [ ] general progress 2 weeks to 1 month
      - [ ] relative progress when stroke is more then 1 month, exept round numbers of other stats:1 year stroke or 100 verses learned...
      - [ ] different finish screen label: presistent learner, perfect tester(no errors), error buster(a lot of errors), grower(some maxLavel updates)
- [ ] register and login (confirm email or google/facebook login) v0.0.9
  - [ ] feedback form for authorirized users or telegram bot
  - [ ] change data safety settings and privacy policy
- [ ] sync + custom sync(without need for registration) v1.0.0
  - [ ] autosync & manualsync action
  - [ ] custom sync and documentation web page for it
  - [ ] about page and donate button
  - [ ] screen readers labels

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