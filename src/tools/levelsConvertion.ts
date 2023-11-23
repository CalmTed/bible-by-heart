import { PASSAGELEVEL, TESTLEVEL } from "../constants";

export const testLevelToPassageLevel: (t: TESTLEVEL) => PASSAGELEVEL = (t) => {
    switch(t){
        case TESTLEVEL.l10: 
        case TESTLEVEL.l11: 
            return PASSAGELEVEL.l1
        case TESTLEVEL.l20: 
        case TESTLEVEL.l21: 
            return PASSAGELEVEL.l2
        case TESTLEVEL.l30: 
            return PASSAGELEVEL.l3
        case TESTLEVEL.l40: 
            return PASSAGELEVEL.l4
        case TESTLEVEL.l50: 
            return PASSAGELEVEL.l5
        default:
            console.warn("Unknown test level while converting test level to passage level")
            return PASSAGELEVEL.l1
    }
} 

export const passageLevelToTestLevel: (t: PASSAGELEVEL) => TESTLEVEL = (t) => {
    switch(t){
        case PASSAGELEVEL.l1: 
            return Math.random() > 0.5 ? TESTLEVEL.l10 : TESTLEVEL.l11
        case PASSAGELEVEL.l2: 
            return Math.random() > 0.5 ? TESTLEVEL.l20 : TESTLEVEL.l21
        case PASSAGELEVEL.l3: 
            return TESTLEVEL.l30
        case PASSAGELEVEL.l4: 
            return TESTLEVEL.l40
        case PASSAGELEVEL.l5: 
            return TESTLEVEL.l50
        default:
            console.warn("Unknown passage level while converting passage level to test level")
            return TESTLEVEL.l10
    }
} 