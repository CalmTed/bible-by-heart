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
- [ ] #example(action, problem, ) Description of a problem >>> (planned action || action itself || idea || ...)

- [x] #problem Looping dependency in generating tests. Need to decrease level with reducer but regenerare with generator >>> remove screen dependecy from generators
2023-09-27
- [x] #added finish adding downgrading levels after 2 or so errors (set 2 to be editable constant)
- [ ] #idea make general method to convert passageLevel to testLevel and beck with saving correct types
2023-09-29
- [x] #added file manager, but cant open it with file explorer or cant share it for now
2023-10-03
- [x] #added file manager saves text file to the user-seelcted folder
- [x] #added FM now opens selected text file
- [ ] #idea proove that you know new imported passage by testing it to the desirable level
- [ ] #question what if version of export does not support columns: mark version? | go with the latest version
- [ ] #question what if in future versions we rename parameters titles: add back compatibility in future versions
- [ ] #question what if we dont have nedded translations: add new translation with needed langlage and title | fing neede langlage from verse text based of other verses or set default and propose to change in translations list settings if needed
- [x] #added export to CSV
- [ ] #test tried to add intent reciever dunno how to test it yet...