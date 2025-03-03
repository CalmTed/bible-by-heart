2023-09-26
Created this file to ease process of switching betwen projects and for faster recalling after a pause
What to write:
- noticed problems and planned actions to fix them or lack of ideas
- added/removed/fixed/refactired features
- quene of planned additions
Today had some time for coding but stumbled on unfinished probem: looping dependency of generating tests.
And understood thet, even though there were just few days before last change, I complitely forgot what I was doing and how was I planning to fix it.
But writing this will need some more time, and need to be aware that this process in a long run can slow a bit, so need to optimize it as much as possible.
boilerplate:
- [ ] #example(added, problem, idea, question, test, fixed) Description of a problem >>> (planned action || action itself || idea || ...)

- [x] #problem Looping dependency in generating tests. Need to decrease level with reducer but regenerare with generator >>> remove screen dependecy from generators
2023-09-27
- [x] #added finish adding downgrading levels after 2 or so errors (set 2 to be editable constant)
- [x] #idea make general method to convert passageLevel to testLevel and back with saving correct types
2023-09-29
- [x] #added file manager, but cant open it with file explorer or cant share it for now
2023-10-03
- [x] #added file manager saves text file to the user-seelcted folder
- [x] #added FM now opens selected text file
- [ ] #idea proove that you know new imported passage by testing it to the desirable level
- [x] #question what if version of export does not support columns: mark version? | go with the latest version
- [x] #question what if in future versions we rename parameters titles: add back compatibility in future versions
- [x] #question what if we dont have nedded translations: add new translation with needed langlage and title | find neede langlage from verse text based of other verses or set default and propose to change in translations list settings if needed
- [x] #added export to CSV
- [ ] #test tried to add intent reciever dunno how to test it yet...
2023-10-06
- [x] #fixed error with loading app right after instaling: it was unmet error exeption while trying to load unexisted item from local storage
- [x] #test intent reciever works but after opengin app does nothing ... yet
- [x] #intent Today: finish csv export and import Next: add intent feature 1.differentiating text from address 2.adding both or just one 3.diferentiate language 4.ask if unclear
- [x] #fixed fetchibg bug
- [x] #intent to finish importing passages, thinking on not using csv, but just txt with "|" as separator and four colummns (address, text, translation, tags)
2023-10-07
- [x] #added export and import passages to and from txt file
- [x] #intent Next: to make export/import state to json with chechsum Later: handling share text reciever (modal with options)
- [x] #problem what if we have the same address and the same translation?: disallow to add it(or to import) >>> skiping it 
2023-10-31
- [x] #idea importted 5/6 passages and do not replace passages with the same address and translation
2023-11-06
- [x] #intent add json state export(without import)
- [x] #intent fix tests freezing error
- [x] #added export app state to json & remade tests generation
2023-11-07
- [x] #intent to show import warning result & improve level1 tests
- [x] #intent to check Nicks time error
- [x] #intent optimize levels (level1: from errors, same book, same number level 3: less words/groups of words for long level 4,5: not the whole text just parts/hard parts)
- [x] #intent later to add due to and new sorting option(-)
- [x] #plan fix levelPicker dott in testing mode
- [x] #plan check train mode filters validity
- [x] #added did add import warning info & did fix timezone thing(but need to check it anyway)
2023-11-08
- [x] #intent check trainMode filters(+), check LevelPicker dott(+) THEN optimize levels and add "due to" as so on
- [x] #idea due to is considered only if sorting is oldestToTrain
- [x] #added checking trainModes and levelPicker, level 10 optimizing
2023-11-09
- [x] #intent finish optimizing level 11, 30, 40, 50
- [x] #added optimized levels 10,11,20
2023-11-10
- [x] #intent finish optimizing level 30, fix level 1 duplicates
- [x] #added finished optimizing level 3, checked level 1 for duplicated(haven't foud them)
2023-11-14
- [x] #intent optimize levels 40 and 50: enter only a few sentences
2023-11-15
- [x] #intent optimize levels 40 and 50: enter only a few sentences
- [x] #added optimized 40 and 50 to limit number of sentences
2023-11-17
- [x] #intent turn on "due to" switcher, add number selector, add to sorting for "last tested" option
- [x] #intent make harder passwords for dev mode, turn it off after 24h, add devmodeEnabledSwitcheer
- [x] #added due to modal and switcher, updated sorting to included due to passages before others
- [x] #added updated appStateModel for v0.0.9 added userData, updateMessages and feedbackMessages
2023-11-20
- [x] #intent complete new state model + state convertor + new devmode switcher + dev mode timeout check in reducer
- [x] #intent start stats screen + stats tools + passage stats
- [x] #added new state model, state converter, new devmode encoder, devmode timeout disabling, fixing visible errors in each file
- [x] #question how to get data for relative stats? we need to know when each passage was updated to the next level, may be add new parameter to passage model?
- [x] #added passage stats calculating and rendering(general, per level, heatmap, wrong addresses) + state import feature + level5 wrong word calculating to get more data for heatmap + a little of calculating app stats
2023-11-22
- [x] #intent add stats screen with other global stats(time, sessions, stats by session, stats by level) 
- [x] #intent add upgradeDate to passage data so we could retrieve relative score for last two month + write time on udgrade/clear on downgrading (+) + get uprade time from history(for each passage if one is level lower but the next is higher set time of level of the highter one to the time of the lower one)(+)
- [x] #added stats screen with general stats and stats per level
- [x] #question do we include missing days in day/week awarage? > NO
- [x] #idea we need to notify users that some stroke days might be lost due to clearing history of the removed passages
- [x] #idea we can add different WORD icon on the home screen in the Christmass seasona and another one for the Easter
2023-11-23
- [x] #added fixed bug with selecting level11 with single passage
- [x] #added removed test,list,stats buttons in no passages, in this case showing "add passage"
- [x] #intent check stroke calculating b.c. it removes some days on import
- [x] #idea add month showing with data for each day sessions
- [x] #added upgraded passage model, added convertion from history for previus versions
- [x] #added relative score, fixed perfect scrike for selected level, fixed downgrading bug, added level 4 error when selecting wrong word
2023-11-25
- [ ] #error level 11 shows options in different language(translation)
- [x] #added manger svg for december 
2023-11-29
- [x] #intent fix due to modal (add title, next due to date, remove NEVER thing)
- [x] #intent fix passage translation selector (add labels, "reimagine" passage editor)
- [x] #intent add daily and weekly stats(with relative percent), add week and month switcher
- [x] #intent add calendar view(month activity), sessions view(day range)
- [x] #added fixed due to modal, added transtation label in PE, new stats masonary items, fixed relative stats, added daily stats
2023-12-03
- [x] #intent add calendar screen (link in stats, draw days, switch with swipe!)
- [x] #added calendar screen + day stats variation NO data shown yet
2023-12-04
- [x] #intent add calendar days buttons, add day view(total duration, sessions timestamp & duration, passages list, leveling up)
- [x] #added calendar buttons, day stats, swipe action
- [x] #test added new intent recieveing action > dont work still >:(
- [x] #intent add new icon for calendar icon
2023-12-05
- [x] #intent add icon
- [x] #intent fix some labels, time bug, remove animation of calendar, remove input text after submiting
- [x] #intent upgrage outline indication bug
- [ ] #plan more optimized way to render passages list (not a priority now)
- [ ] #idea add achivement flag when passage was trained 4 times in 5th level (NaP)
- [ ] #idea new sorting option: most errored (NaP)
- [x] #added as intentded exept wrong session time in labels 
2023-12-07
- [x] #intent fix session time labeling
- [ ] #idea need to move more swiftly to finish 0.1.0 before 2024-12-31
- [ ] #plan: 
    - add update message screen
    - create API scheeme for API 0.1.0, 
    - create hooks using firebase
    - auth feature (google auth + just email)
    - feedback feature (for auth'ed)
    - custom sync and and documentation (optional)
    - paymnent feature
- [x] #fixed session time label in day stats
- [ ] #intent add different home screen labels (just stroke, absolute and relative score, whole numbers)
    - stroke 1-11 month, 1-n years
    - 10,25,50,100,250... verses learned (level 5)
    - most duration in the last month/year (NaP)
    - most passages upgraded per day for the last month/year (NaP)
    - if several are true, show in order of priority
    - compare todays and yesterdays stats to show only one day(detive thet it was acheved just today)
2023-12-11
- [x] #idea have no time for home screen stats
- [ ] #intennt need to make API scheme
 - unified userModel
 - test model
 - all hooks with required params and returns
2023-12-29
- [ ] #intent remove delete button (delete only if archived) (list, passage editor)
- [ ] #intent ask/confirm before deleting, endning session, deleting data
- [x] #added condition to show delete button, confirmation before exiting tests and preventing going back with a swipe
2025-02-02
- plan
    - [ ] review all files and mark problems
        - [ ] centralize context for theme, l10n,
        - [ ] abstraction for passage: address methods, get sentanses, 
        - [ ] themed text component l1.tsx:117
        - [ ] unified error message
        - [ ] separete files for each level
        - [ ] vibration unil for auto check of setting.hapticsEnabled + same with sound
    - [ ] recreate navigator for bottom menu and reanimated
    - [ ] update l10n with package and layered data file

    - [ ] optimize list and fix a bug
    - [ ] recreate testing screen: animation, no dobling common buttons
    - [ ] rewrite test creation add more abstraction for better calibration 
    - [ ] add login screen and add basic features(just user data sync for now)


    - [ ] add intent handler
    - [ ] add language fetcher for non copyrighted traslations
    - [ ] add paymment feature
2025-02-04
- the amount of tasks feals heavy... need to centralize all of them, categorize and sort the most important
- what's my goal: create a tool to simplify learning by orgamizing, regular testing and analizing statistics
2025-02-25
- still very frustrated to do at least something
- will try to categorize and prioritize all tasks tonight
    - bug
    - inconvenience
    - new feature
- defined next tasks as follows
    1. [x] fix compare address bug
    2. [x] fix autocompleted test on 4th level
    3. [x] fix translation and first added passage bug
    4. fix autocompleted test on 3rd level
    5. fix awkward buttons on 3rd level (complete button?)
    6. add login screen
    7. estimate time of testing upfront
    8. estimate test dificulty - make least number of hard ones or promotions
    9. gradualy lower mex level after a long time without testing
    10. store error long localy for debuging 
    11. fix notificatio bug
    12. fix svg bug
    13. fix null in address errors
- refactoring tasks
    - break levels to separate parts and files
    - add useContext for t()
    - make address distance use exact number of verses
    - make address difference return boll and check for non complete address(e.g. "Gen 1:1 === Gen 1:1-1:1" )
    - should check for incoplete address on creation (in address picker) and convert it to complete address
    - redo notofocation time triger and adaptation learning (date, week day, days after previus)
    - useAddresPicker hook
    - abstaction for passage to unify methons like get sentanses
    - 
2025-02-28
- started fixing address comparison bug
2025-03-04
- fixed address bug
- fixed level 4 completed bug
- 
