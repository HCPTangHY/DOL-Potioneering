/**
 * Potioneering 事件数据库
 */

setup.Pot.EventSystem.register([
    // --- 走廊事件池 (PotHallway) ---
    {
        pool: "PotHallway",
        passage: "Pot Hallway Discover Door",
        weight: 5,
        frequency: ["once", 1],
        condition: () => {
            // 需要 History >= 200，且还没发现门
            return currentSkillValue('history') >= 200 && 
                   (!V.Pot || V.Pot.sageStage === undefined || V.Pot.sageStage === 0);
        },
        run: () => {
            // 记录发现门的时间
            V.Pot.doorDiscoverDay = Time.days;
        }
    },
    {
        pool: "PotHallway",
        passage: "Pot Hallway Meet Sage",
        weight: 5,
        frequency: ["once", 1],
        condition: () => {
            // 已发现门(stage 1)，且至少过了3天
            return V.Pot && V.Pot.sageStage === 1 && 
                   V.Pot.doorDiscoverDay !== undefined && 
                   Time.days >= V.Pot.doorDiscoverDay + 2;
        }
    },
    {
        pool: "PotHallway",
        passage: "Pot Hallway Sage Random",
        weight: 5,
        frequency: ["daily", 1],
        condition: () => {
            // 已解锁实验室
            return V.Pot && V.Pot.sageStage >= 2;
        }
    },
    
    // --- 食堂事件池 (PotCanteen) ---
    {
        pool: "PotCanteen",
        passage: "Pot Canteen Meet Sage",
        weight: 8,
        frequency: ["daily", 1],
        condition: () => {
            // 已解锁实验室，午餐时间
            return V.Pot && V.Pot.sageStage >= 2 && V.schoolstate === "lunch";
        }
    },
    
    // --- 塞吉对话池 (PotSageTalk) ---
    {
        pool: "PotSageTalk",
        passage: "PotSageTalkChemistry",
        weight: 10,
        frequency: ["daily", 1]
    },
    {
        pool: "PotSageTalk",
        passage: "PotSageTalkSchool",
        weight: 5,
        frequency: ["daily", 1]
    },
    {
        pool: "PotSageTalk",
        passage: "PotSageTalkHobby",
        weight: 5,
        frequency: [3, 1],
        condition: () => V.NPCName[V.NPCNameList.indexOf("Sage")].love >= 10
    },
    
    // --- 实验室环境事件池 (PotLabAmbience) ---
    {
        pool: "PotLabAmbience",
        passage: "PotLabEventExplosion",
        weight: 5,
        chance: 20
    },
    {
        pool: "PotLabAmbience",
        passage: "PotLabEventMess",
        weight: 8,
        chance: 30
    }
]);
