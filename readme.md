## Bible by heart

Another app for learning Bible passages but with some personalization

## Whats different from analogus apps:

- stroke counter
- address learning tests for black box learning method
- ukrainian interface language (add your if you want)
- customizable Bible translation
- offline-first and free (syncying options might be paid in future to support work)

## Whats the same:

- passages list(add, remove, edit)
- reminders notification
- difficulty levels

## Current plan
1. Add basic history sync - 
  - API add basic api documentation
  - API add username check
  - API add session as readible string
  - add loading indicator for reg and login
  - add reset password screen(link from login after wrong password atempt)
  - publish on AppStore
  - admin page (web?)
    - user list and stats
    - edit user data
    - navigate user passages and history data
    - show uneditable api log (log admin activity and major user activity)
    - db migration helper (backup helper)
    - whole data viewer
  - you are offline indicator
  - history sync
    - sync history
      - when: after test finish, on app open, after 3 hours after previus, manualy
      - how: compare, last change and checksum, only after that try to sync
      - if conflict: ask for overwriting or trying to merge if there are conflicts (add tests from both)
      - indicate % of syncing if there are lots of data
    - sync also: passages, train modes, translations, settings parameters
2. Refactoring
  - theme from useContext
  - deep links and more screens
  - animation for navigation, testing settings, auth screens(bottom menu, swipes etc.)
  - layered l10n module
  - refactor testing screens
    - animaton
    - error feedback (4, 5 level)
    - more handy downgrade and change level buttons
    - show different stats on home screen
      - stroke: first two weeks
      - general progress: 2 weeks to 1 month
      - relative progress: when stroke is more then 1 month, exept round numbers of other stats:1 year stroke or 100 verses learned...
    - different finish screen label: presistent learner(lots of time), perfect tester(no errors), error buster(a lot of errors), grower(some maxLavel updates)
      - propose to add new passages if all of them are 4/5 level, or to stop adding them if too much errors everyday
    - abstration like Passage.methons() and Address.methods() or getSomthing(object)
      - while state object as abstracted Object with methods
    - calculate probable time of learning
    - menu for testing options(level picker, downgrade...) somewhere on the testing screen
  - components index file
  - screen readers labels
  - state change with redo button (passage editor)
  - update address picker 
    - label what to choose (aka. select book)
    - change perticular address part
    - long press to select whole chapter
  - smart notifications and saving feedback(when user clicked)
    - cancel for today if already learned
    - "oh what is  that?IS it yuor personal reminder to test" 
    - cuctom nutification text, train mode (PREMIUM)
    - propose to train favorite passage (get fav passage from stats)
    - want about losing streak ("are you sure you can hanle losing streak?")
    - custom sound (hinmn melody or sword drawing)
    - logic
      - take: time of learning, weekday(is weekend), give: time for today
      - add to matrix(ML) onlt recent test history
3. Add new features
  - add passages from lists
  - fetch ukrainian translations (indicate for wihch it is possible)
  - add passages from intents
  - add friends searching, requesting. confirming, blocking(dont show in search, cant request) 
    - "2 friends in common" 
    - "have 3 passages in common"
    - add with referal link for free premium for 30 days for both
    - one more month if new friend have tasted 15 days out of 30.
  - broadcast messages with alert for unread and history for all
    - update admin panel for that
  - feedback messenger with alert and push notificatios and history
    - update admin panel for that
  - add premium features
    - limitations for free users
    - badge
    - group administring
    - setting personal goals (for persistence)
    - connetct to paynment systems for both apple and google
    - unique badge foe the first 100 people
    - free year for free premium
    - trial month for everybody
  - login with google or apple Oauth
  - badges and accomplishments
  - add feed with: 
    - daily stats("tested X passages today"), 
    - "knows total of 20 passages with level 4", 
    - reached 100 days streak, 
    - added new passage from Rom 8:28 "add to your list", 
    - ability to like/react eachother posts
    - share: 
      - finish screens
      - propose to learn perticular passage
    - "3 of your friends already tested today"
  - groups
    - group stats
    - shareded lists
    - group goals and quests
4. Other upgrade ideas
  - add custom sounds
  - list updates
    - miltiple actions in list
    - hightlint search text 
    - sort oposite of selected
    - autocompletion for tags (add from list)
    - button "show hidden verses" or "remove filters" down bellow
  - testing updates
    - few tests for one lon passage
    - add test with camera
    - test with voice
    - l31 - only punctuation
    - l4 - hard, with no autocomplete but with validation
    - l51 - only partial
    - l5 - show definitive typos "not to but too"...
    - l5 - change capitalization
    - train only one passage several times ("train just this verse")
    - sort by number of errors
    - show right answer even after test in finished
    - show whole text after finishing(Nick)
    - mark for perfect knowlage for finishing 5 level several times
    - gradual level downgrading if not testing (not just last time but regilarity)
    - on minor error (ask "are you sure?") or tell ("almost, next time do this right")
    - appoximate difficulty calculation for default train mode (3 of level 3 != 3 of level 1)
      - derive by eather error rate or just average time for each
    - gradual incrtease of diificulty for long pasages in level 3 (first 5 verses with no error, then second with reminding of the first sometimes, only then third part)
  - stats
    - add graphs

## Using

_Installing requirements:_

- (for Windows) expo tools and packages from package.json
- (for Linux) it will install from package.json

_Cloning:_

- run `git clone https://github.com/CalmTed/bible-by-heart.git`

_Instaling:_

- run `yarn install`

_Running:_

- run `yarn run dev` to start expo (a - run on android, r - reload...)

_Building:_
- One needs to be authorized in expo account to be able to buld with eas.
- Github action will build and submit staging and production branches automaticaly on push
- For manual build and publication `yarn build-dev` or `yarn build-prod`.