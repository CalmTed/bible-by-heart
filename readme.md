Bible by heart
---

Another app for learning Bible passages but with some personalization

Whats different from analogus apps:
---

- stroke counter 
- address learning tests for black box learning method
- ukrainian interface language (add your if you want)
- customizable Bible translation
- fully offline and free (syncying options might need some payment in future)

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
- [ ] list manipulation (add, remove, edit, archive, search, filter)
  - [x] address selector
  - [x] add, remove
  - [x] edit text, set tag(archive)
  - [x] search (text, address, tag)
  - [ ] filter any parameter array (address, catagory, selectedLevel)
  - [x] sorting
  - [x] edit address
- [x] address testing view (generate tests, get answers, float wrong answers to the end, result screen) v0.0.4
- [x] more levels, open level by learning, level select v0.0.5
  - [x] l1, l2, progressing, level switcher
  - [x] l3, l4, l5
- [ ] save stats (tests result, stroke, weekly progress) v0.0.6
  - [ ] stroke counter
  - [ ] weekly progress
- [ ] app settings (language, theme, bible translation, notifications, lists(categories) to hide from tests) v0.0.7
  - [ ] adding passages from prepared list in the most popular translations
  - [ ] different modes (fast, infinite/timed, all due to, hardest/most errored) & modes customazation(name, tags includex, excluded)
- [ ] customizable daily reminder v0.0.8
- [ ] register and login (confirm email or google/facebook login) v0.0.9
- [ ] sync + custom sync(without need for registration) v1.0.0
  - [ ] feedback form for authorirized users
 
Dev. rules
---
1. use setState(reduce()) for state manupulation don't use just useState()
2. use navigateWithState for screen changing dont use just navigate EXEPT goback
3. use createT(langCode) and t(word) for l10n dont use unlocalized text in UI

Using
---
*Installing:*
- android sdk
- expo tools and packages from package.json

*Running:*
- run `npm start` to start expo (a - run on android, r - reload...)

*Building:*
- `eas build --platform android --profile [preview | production]` to build apk(preview) or aab(production) file (need expo eas account)