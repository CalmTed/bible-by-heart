Bible by heart
---

Another app for learning Bible passages but with some personalization

Whats different from analogus apps:
---

- stroke counter 
- address learning tests for black box learning method
- ukrainian interface language
- customizable bible translation
- fully offline and free (syncying options might be for some price in future)

Whats the same:
---

- passases list(add, remove, edit)
- remonders notification
- difficulty levels

Roadmap
---

-[+] asyncly get local storage
-[+] navigation, state management
-[+] interface l10n support
-[ ] list manipulation (add, remove, edit, archive, search, filter)
  - [ ] address selector
  - [ ] add, remove
  - [ ] edit text, set tag(archive)
  - [ ] search (text, address, tag)
  - [ ] filter ady parameter array (address  group, max level, curr level, date) or sorting?
-[ ] address testing view (generate tests, get answers, float wrong answers to the end, result screen)
-[ ] more levels, open level by learning, level select
-[ ] save stats (tests result, stroke, weekly progress)
-[ ] app settings (language, theme, translation, notifications)
-[ ] customizable daily reminder
-[ ] register and login (confirm email or google/facebook login)
-[ ] sync + custom sync

Dev. rules
---
1. use setState(reduce()) for state manupulation don't use just useState()
2. use navigateWithState for screen changing dont use just navigate EXEPT goback
3. use createT(langCode) and t(word) for l10n dont use unlocalized text in UI