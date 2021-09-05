exports.mod = (mod_data) => {
    var fs = require('fs');
    var path = require('path');
    let PathResolver = global.internal.path.resolve
    let ModFolder = `user/mods/${mod_data.author}-${mod_data.name}-${mod_data.version}/files/`
    let settings = mod_data.settings
    if (!settings.Agree){
        return logger.logError(`[Daily Quest] This mod is disabled, to enable please read the README inside this mod folder\n`)
    }
    let debug = settings.debug
    var vtime = false
    
    //load Mod Files
    let blankQuest = fileIO.readParsed(PathResolver(`${ModFolder}blankQuest.json`))
    let condList = fileIO.readParsed(PathResolver(`${ModFolder}conditions.json`))
    let desc = fileIO.readParsed(PathResolver(`${ModFolder}questDesc.json`))
    let lastquest = fileIO.readParsed(PathResolver(`${ModFolder}lastquest.json`))
    let lastquesten = fileIO.readParsed(PathResolver(`${ModFolder}lastquesten.json`))
    let diaFile = fileIO.readParsed(PathResolver(`${ModFolder}dialogue.json`))
    let weapFile = fileIO.readParsed(PathResolver(`${ModFolder}weapon.json`))
    let fetchFile = fileIO.readParsed(PathResolver(`${ModFolder}fetch.json`))
    
    //load cached quest files
    let quests = global.fileIO.readParsed(PathResolver('user/cache/quests.json'))
    let locale = global.fileIO.readParsed(PathResolver('user/cache/locale_en.json'))
    let lMail = locale.mail
    
    //set temp quest info
    let newQuest = blankQuest
    let nQID = utility.generateNewItemId()
    let DailyQID = `Daily${nQID}`
    let run = firstRun(ModFolder)
    if (run === true){
        let available = []
        if (settings.fetch.enabled){
            available.push("Fetch")
        }
        if (settings.elimination.enabled){
            available.push("Elimination")
        }
        if (settings.contract.enabled){
            available.push("Hit")
        }
        let qType = randomItem(available)
        createQuest(qType)
        if (qType === "Hit" && vtime){
            newQuest.image = "/files/quest/icon/5979ef2a86f77431185415c3.jpg"
        }
        quests.data.push(blankQuest)
        dbugmessage(`Pushing Quest file`)
        fileIO.write(PathResolver('user/cache/quests.json'), quests, true)
        fileIO.write(PathResolver(`${ModFolder}lastquest.json`), blankQuest, true)
        locale.quest[DailyQID] = desc
        fileIO.write(PathResolver('user/cache/locale_en.json'), locale, true)
        fileIO.write(PathResolver(db.locales["en"].quest), locale.quest, true)
        fileIO.write(PathResolver(`${ModFolder}lastquesten.json`), locale, true)
        return logger.logSuccess(`New Daily Quest Added`)
    }else{ 
        quests.data.push(lastquest)
        fileIO.write(PathResolver('user/cache/locale_en.json'), lastquesten, true)
        fileIO.write(PathResolver(db.locales["en"].quest), lastquesten.quest, true)
        return logger.logSuccess(`Daily Quest Applied`)
    }
    function getDialogue(mType, message){
        if (mType === "hit"){
            desc.conditions[`condition${nQID}`] = `kill ${message.target}`
            lMail.DailyDone = randomItem(diaFile.Done)
            let dialogue = `I have a new Contract for you to carry out, the conditions are:\n\n`
            dialogue = dialogue.concat(`Target: ${message.target}\n`)
            dialogue = message.weapon != undefined ? dialogue.concat(`Weapon: ${message.weapon}\n`) : dialogue.concat(`Weapon: Any\n`)
            dialogue = message.dist != undefined ? dialogue.concat(`Distance: ${message.dist}\n`) : dialogue.concat(`Distance: Any\n`)
            dialogue = message.time != undefined ? dialogue.concat(`Time: ${message.time}\n`) : dialogue.concat(`Time: Any\n`)
            dialogue = message.part != undefined ? dialogue.concat(`Kill Shot: Head\n`) : dialogue.concat(`Kill Shot: Any\n`)
            if (message.silenced){
                dialogue = dialogue.concat(`try to do this one quietly\n`)
                newQuest.image = "/files/quest/icon/5ae3274386f7745b4246b387.jpg"
            }
            if (message.gotBonus){
                let bonText = randomItem(diaFile.bonus)
                dialogue = dialogue.concat(`\n${bonText}`)
            }
            lMail.DailyDesc = dialogue
            dbugmessage(`${dialogue}`)
        }
        if (mType === "fetch"){
            let sect1 = randomItem(diaFile.one)
            let sect2 = randomItem(diaFile.two)
            let sect3 = randomItem(diaFile.three)
            let bonText = randomItem(diaFile.bonus)
            let thisDialogue = `${sect1} ${sect2} ${message.cat}, ${sect3}\n`
            if (message.bonus){
                thisDialogue = thisDialogue.concat(`\n${bonText}`)
            }
            lMail.DailyDesc = `${thisDialogue}`
            lMail.DailyDone = randomItem(diaFile.Done)
            newQuest.image = message.image
            dbugmessage(`${thisDialogue}`)
        }
    }
    function randomItem(list){
        let len = (list.length -1)
        let randomIndex = utility.getRandomInt(0,len)
        return list[randomIndex]
    }
    function createQuest(type){
        newQuest._id = DailyQID
        if (type === "Hit"){
            settings = settings.contract
            let target, res, side, mTime, targetValue
            let killNumber = utility.getRandomInt(settings.min, settings.max)
            let condition = condList.kill[0]
            let message = {"bonus": false, "silenced": false}
            let randSelect = utility.getRandomInt(0, 100)
            if (randSelect <= settings.chances.boss || settings.onlyBosses){
                    res = getTarget("Boss")
                    targetValue = 35000
            }else{
                if (utility.getRandomInt(1,2) === 1){
                    res = getTarget("Pmc")
                    targetValue = 20000
                }else{
                    res = getTarget("Scav")
                    targetValue = 10000
                }
            }
            side = res.side
            let rubles = killNumber * targetValue
            dbugmessage(`****Contract Kill /-${killNumber}-/ ${res.target} --`)
            message.kill = killNumber
            message.target = res.target
            newQuest.rewards.Success.push(addReward(0, nQID, rubles, "5449016a4bdc2d6f028b456f", false))
            if (utility.getRandomInt(0,4) === 2){
                if (utility.getRandomInt(1,2) === 2){
                    let vInd = randomItem(fetchFile.val)
                    let special = vInd.id
                    dbugmessage(`Bonus Loot Applied ${vInd.name}`)
                    newQuest.rewards.Success.push(addReward(1, nQID, 1, special, true))
                }else{
                    let rWeap = randomItem(weapFile.weapons)
                    rWeap.index = 1
                    rWeap.unknown = true
                    dbugmessage(`Bonus Loot Applied /--/ Random Weapon`)
                    newQuest.rewards.Success.push(rWeap)
                }
                message.gotBonus = true
            }
            newQuest.rewards.Success.push(addReward(2, nQID, 1, "fleakey", false))
            if (!settings.anyWeapon){
                let selected = randomItem(weapFile.spec)
                condition._props.counter.conditions[0]._props.weapon = selected.id
                dbugmessage(`WEAPON TYPE - ${selected.type}`)
                message.weapon = selected.type
                message.image = randomItem(selected.image)
            }
            if (utility.getRandomInt(1,4) === 4){
                dbugmessage(`WEAPON TYPE - Must Be Silenced`)
                if (message.weapon != "Grenade"){
                    condition._props.counter.conditions[0]._props.weaponModsInclusive = weapFile.silenced
                    message.silenced = true
                }
            }
            if (!settings.anyTime){
                switch (utility.getRandomInt(1,3)){
                    case 1:
                        condition._props.counter.conditions[0]._props.daytime = {"from": 20, "to": 5}
                        mTime = "Night (10pm til 5am)"
                        break
                    case 2:
                        condition._props.counter.conditions[0]._props.daytime = {"from": 6, "to": 12}
                        mTime = "Morning (6am til 12pm)"
                        break
                    case 3:
                        condition._props.counter.conditions[0]._props.daytime = {"from": 12, "to": 18}
                        mTime = "Afternoon (12pm til 6pm)"
                }
                message.time = mTime  
            }
            if (!settings.anyDistance){
                let mDist
                let thisMinDist = 10
                let thisMaxDist = settings.maxDistance
                if (message.weapon === "Pistol"){
                    thisMinDist = 5
                    thisMaxDist = 25
                }
                if (message.weapon === "Shotgun"){
                    thisMinDist = 5
                    thisMaxDist = 50
                }
                let dist = utility.getRandomInt(thisMinDist,thisMaxDist)
                if (message.weapon != "Grenade"){
                    if (dist <= 40){
                        condition._props.counter.conditions[0]._props.distance = {"compareMethod": "<=", "value": dist}
                        mDist = `Closer than ${dist} Metres`
                    }else {
                        condition._props.counter.conditions[0]._props.distance = {"compareMethod": "=>", "value": dist}
                        mDist = `Further than ${dist} Metres`
                    }
                    message.dist = mDist
                }
            }
            if (settings.onlyHead){
                if (message.weapon != "Grenade"){
                    condition._props.counter.conditions[0]._props.bodyPart = ["Head"]
                    message.part = "Head"
                }
            }
            condition._props.counter.conditions[0]._props.savageRole = [side]
            side = "Savage"
            condition._props.id = `condition${nQID}`
            getDialogue("hit", message)
            condition._props.counter.id = utility.generateNewItemId() 
            condition._props.counter.conditions[0]._props.id = utility.generateNewItemId()
            condition._props.value = killNumber
            condition._props.counter.conditions[0]._props.target = side
            newQuest.conditions.AvailableForFinish.push(condition)
            let failCon = condList.fail[0]
            failCon._props.id = `failCon${nQID}`
            newQuest.conditions.Fail.push(failCon)
            desc.conditions[`failCon${nQID}`] = `Get out alive`
            lMail.DailyDone = randomItem(diaFile.Done)
            lMail.DailyExp = "The user has deleted this message"
            lMail.DailyFail = randomItem(diaFile.Fail)       
        }
        if (type === "Fetch"){
            settings = settings.fetch
            let choices = ["tools", "build", "house", "elec", "Consum"]
            let message = {"bonus": false}
            let fetchNumber = utility.getRandomInt(settings.min, settings.max)
            let rubles = 0
            if (fetchNumber === settings.max){
                message.bonus = true
                dbugmessage(`Bonus Loot Applied FleaKey`)
            newQuest.rewards.Success.push(addReward(1, nQID, 1, "fleakey", false))
            }
            if (utility.getRandomInt(1,4) === 3){
                let vInd = randomItem(fetchFile.val)
                message.bonus = true
                dbugmessage(`Bonus Loot Applied ${vInd.name}`)
                newQuest.rewards.Success.push(addReward(2, nQID, 1, vInd.id, true))
            }
            if (!settings.randomItems){
                let tmpChoice = randomItem(choices)
                dbugmessage(`****NONE RANDOM CAT /-${fetchNumber}-/ ${tmpChoice}`)
                tmpList = fetchFile[tmpChoice]
                switch (tmpChoice){
                    case "Consum":
                        message.cat = "general supplies"
                        message.image = "/files/quest/icon/5979d3da86f774719f309082.jpg"
                        break
                    case "elec":
                        message.cat = "electrical supplies"
                        message.image ="/files/quest/icon/5979ed4c86f7742f55674442.jpg"
                        break
                    case "tools":
                        message.cat = "tools"
                        message.image = "/files/quest/icon/5979d3f986f7746d08051ce0.jpg"
                        break
                    case "build":
                        message.cat = "building materials"
                        message.image = "/files/quest/icon/5ae4a76086f774455f7d62d2.jpg"
                        break
                    case "house":
                    message.cat = "essential supplies"
                    message.image = "/files/quest/icon/5ae4a76086f774455f7d62d2.jpg"
                } 
            }else{
                message.cat = "items"
                message.image = "/files/quest/icon/5ae4a76086f774455f7d62d2.jpg"
            }
            fIndx = 1
            i = fetchNumber
            while (i != 0){
                if (settings.randomItems){
                    let tmpChoice = randomItem(choices)
                    dbugmessage(`****RANDOM CAT /-${fetchNumber}-/ ${tmpChoice} --`)
                    tmpList = fetchFile[tmpChoice]
                }
                let tInd = randomItem(tmpList)
                getNum = utility.getRandomInt(1, settings.perItem.max)
                let multiply = (getNum * getItemPrice(tInd.id))
                rubles = (rubles + multiply)
                let condition = addFetch(fIndx, nQID, tInd, fetchNumber, getNum)
                dbugmessage(`****Item Added /--/${tInd.id} ${getNum} ${tInd.name} -- ${rubles}`)
                i--
                fIndx = (fIndx + 2)
                newQuest.conditions.AvailableForFinish.push(condition[0])
                if (settings.findFirst){
                    newQuest.conditions.AvailableForFinish.push(condition[1])
                }
            }
            newQuest.rewards.Success.push(addReward(0, nQID, rubles, "5449016a4bdc2d6f028b456f", false))
            getDialogue("fetch", message)
            newQuest.type = "PickUp"
            lMail.DailyExp = "The user has deleted this message"
        }
        if (type === "Elimination"){
            settings = settings.elimination
            let killNumber
            let target
            let condition = condList.kill[0]
            let sel = utility.getRandomInt(0, 100)
            let side
            if (sel <= settings.chances.pmc){
                res = getTarget("Pmc")
                side = res.side
                target = res.target
            }else if (sel >= 90){
                target = "Boss"
            }else{
                side = "Savage"
                target = "Scavs"
            }
            if (target != "Boss"){
                killNumber = utility.getRandomInt(settings.min, settings.max)
                let rubles = killNumber * 5000
                dbugmessage(`****Standard Kill /-${killNumber}-/ ${target} --`)
                newQuest.rewards.Success.push(addReward(0, nQID, rubles, "5449016a4bdc2d6f028b456f", false))
                if (killNumber === settings.max){
                    let rWeap = randomItem(weapFile.weapons)
                    rWeap.index = 1
                    rWeap.unknown = true
                    newQuest.rewards.Success.push(rWeap)
                    dbugmessage(`****Bonus Loot Added /-01-/ Weapon Type --`)
                    newQuest.image = "/files/quest/icon/5979ef2a86f77431185415c3.jpg"
                }
            }else{
                res = getTarget("Boss")
                side = res.side
                target = res.target
                killNumber = utility.getRandomInt(settings.bossMin, settings.bossMax)
                let rubles = killNumber * 20000
                dbugmessage(`****Boss Kill /-${killNumber}-/ ${target} --`)
                newQuest.rewards.Success.push(addReward(0, nQID, rubles, "5449016a4bdc2d6f028b456f", false))
                newQuest.rewards.Success.push(addReward(1, nQID, 1, "fleakey", false))
                condition._props.counter.conditions[0]._props.savageRole = [side]
                if (killNumber === settings.bossMax){
                    let rWeap = randomItem(weapFile.weapons)
                    rWeap.index = 2
                    rWeap.unknown = true
                    dbugmessage(`****Bonus Loot Added /-01-/ Weapon Type --`)
                    newQuest.rewards.Success.push(rWeap)
                }
                side = "Savage"
                newQuest.image = "/files/quest/icon/5979d3ea86f7746d0b3e3fdc.jpg"
            }
            newQuest.type = "Elimination"
            condition._props.value = killNumber
            condition._props.counter.id = utility.generateNewItemId()
            condition._props.counter.conditions[0]._props.id = utility.generateNewItemId()
            condition._props.counter.conditions[0]._props.target = side
            condition._props.id = `condition${nQID}`
            newQuest.conditions.AvailableForFinish.push(condition)
            desc.conditions[`condition${nQID}`] = `kill ${target}`
            let qimage = randomItem(diaFile.images)
            dbugmessage(`${qimage}`)
            newQuest.image = `${qimage}`
            let diaOne = randomItem(diaFile.kill1)
            let diatwo = randomItem(diaFile.kill2)
            let diathree = randomItem(diaFile.kill3)
            let diafour = randomItem(diaFile.kill4)
            lMail.DailyDesc = `${diaOne} ${diatwo} ${diathree} ${diafour}`
            dbugmessage(`${lMail.DailyDesc}`)
            lMail.DailyDone = randomItem(diaFile.Done)
            lMail.DailyExp = "The user has deleted this message"
        }
    }
    function dbugmessage(data){
        if (debug){
            logger.logDebug(`${data}`)
        } 
    }
    function addFetch(index, nQID, item, maxItem, getNum){
        let cond = fileIO.readParsed(PathResolver(`${ModFolder}conditions.json`))
        let thisCon = []
        let find = cond.find[0]
        let findP = cond.find[0]._props
        let hand = cond.hand[0]
        let handP = cond.hand[0]._props
        if (maxItem === settings.max){
            findP.value = 1
            handP.value = 1
        }else{
            findP.value = getNum
            handP.value = getNum
        }
        handP.index = (index + 1)
        handP.id = `hand${index}${nQID}`
        handP.target.push(item.id)
        desc.conditions[`hand${index}${nQID}`] = `Hand Over ${item.name}`
        if (settings.findFirst){
            findP.index = index
            findP.id = `fetch${index}${nQID}`
            findP.target.push(item.id)
            let visCond = {
                "_parent":"CompleteCondition",
                "_props":{
                    "target": `fetch${index}${nQID}`,
                    "id": utility.generateNewItemId(),
                }
            }
            handP.visibilityConditions.push(visCond)
            desc.conditions[`fetch${index}${nQID}`] = `Find ${item.name}`
            thisCon.push(find)
        }
        thisCon.push(hand)
        return thisCon
    }
    function getTarget(type){
        let boss = ["bossKilla", "bossBully", "bossGluhar", "bossKojaniy", "bossSanitar", "followerGluharSnipe"]
        let target = ["Killa", "Rashala", "Glukhar", "Shturman", "Sanitar", "The Punisher"]
        let savage = ["marksman", "pmcBot", "followerBully"]
        let sTarget = ["Sniper Scavs", "Raiders", "Reshala's Guards"]
        let pmc = ["Usec", "Bear", "AnyPmc"]
        let pTarget = ["Usec Operators", "Bear Operators", "Bear and Usec Operators"]
        let indx, choice
        switch (type){
            case "Boss":
                indx = (boss.length -1)
                choice = utility.getRandomInt(0,indx)
                return {"side":boss[choice],"target":target[choice]}
            case "Pmc":
                indx = (pmc.length -1)
                choice = utility.getRandomInt(0,indx)
                return {"side":pmc[choice],"target":pTarget[choice]}
            default:
                indx = (savage.length -1)
                choice = utility.getRandomInt(0,indx)
                return {"side":savage[choice],"target":sTarget[choice]}
        }
    }
    function getItemPrice(tpl){
        let templates = fileIO.readParsed(db.user.cache.templates)
        let price = 0
        if (typeof (global.templatesById) === "undefined"){
            global.templatesById = {}
            templates.data.Items.forEach(i => templatesById[i.Id] = i)
        }
        if (tpl in templatesById){
            let template = templatesById[tpl]
            price = template.Price
        }else{
            let item = global._database.items[tpl]
            price = item._props.CreditsPrice
        }
        return price
    }
    function addReward(count, nQID, rewardCount, tplReward, hide){
        let thisReward = {}
            thisReward.target = `reward${count}${nQID}`
            thisReward.value = rewardCount
            thisReward.type = "Item"
            thisReward.index = count
            thisReward.id = utility.generateNewItemId()
            thisReward.unknown = hide
        thisReward.items = []
        let rewardItem = {}
            rewardItem._id = `reward${count}${nQID}`
            rewardItem._tpl = tplReward
            rewardItem.upd = {"StackObjectsCount": rewardCount}
            thisReward.items.push(rewardItem)
        return thisReward
    }
    function firstRun(ModFolder){
        let timeNow = Math.floor(Date.now() / 1000)
        if(fileIO.exist(`${ModFolder}dailyTimer.json`)){
            let lastTime = fileIO.readParsed(PathResolver(`${ModFolder}dailyTimer.json`))
            if ((lastTime + 86400) <= timeNow){
            //if (lastTime <= timeNow){
                clearQuests()
                fileIO.write(PathResolver(`${ModFolder}dailyTimer.json`), timeNow, true, false)
                return true
            }
            return false
        }else{
            vtime = true
            moveImages(`${ModFolder}images/`, `res/quest/`)
            clearQuests()
            fileIO.write(PathResolver(`${ModFolder}dailyTimer.json`), timeNow, true, false)
            return true
        }
    }
    function clearQuests(){
        let accounts = fileIO.readParsed(PathResolver(db.user.configs.accounts))
        for (let accountID in accounts) {
            dbugmessage(`${accountID}`)
            if(!fileIO.exist(`user/profiles/${accountID}/character.json`)){
                dbugmessage(`skipping ghost profile`)
                continue
            }
            let profile = fileIO.readParsed(PathResolver(`user/profiles/${accountID}/character.json`))
            let quests = profile.Quests
            for (let [i, qID] of Object.entries(quests)) {
                if (qID.qid.includes("DailyI")) {
                    dbugmessage(`${i} ${qID.qid} found old quest`)
                    quests.splice(i, 1)
                    dbugmessage(`Expired Quest deleted`)
                }
            }
            let dia = fileIO.readParsed(PathResolver(`user/profiles/${accountID}/dialogue.json`))
            let messages = dia[`579dc571d53a0658a154fbec`]
            if (messages != undefined){
                messages = messages.messages
                for (let [i, msg] of Object.entries(messages)) {
                    if (msg.templateId.includes("DailyDe") || msg.templateId.includes("DailyDon") ) {
                        dbugmessage(`${i} ${msg._id} found old message`)
                        num = i
                        msg.templateId = "DailyExp"
                        dbugmessage(`Expired Message deleted`)
                    }
                }
            }
            fileIO.write(PathResolver("user/profiles/"+ accountID +"/character.json"), profile, true)
            fileIO.write(PathResolver("user/profiles/"+ accountID +"/dialogue.json"), dia, true)
        }
        
        Clean = fileIO.readParsed(PathResolver(`${ModFolder}cleanQuest.json`))
        fileIO.write(PathResolver(db.locales["en"].quest), Clean, true)
        locale.quest = Clean
        fileIO.write(PathResolver('user/cache/locale_en.json'), locale, true)
    }    
    function moveImages(sourceDir, destDir){
        fs.readdir(sourceDir, function(err, files){
            if(err){
                dbugmessage(`${err}`)
                return err;
            }
            else {
                files.forEach(function(file){
                    var dotIndex = file.lastIndexOf(".");
                    var name = file.slice(0, dotIndex);
                    var newName = (name) + path.extname(file);
                    var read = fs.createReadStream(path.join(sourceDir, file));
                    var write = fs.createWriteStream(path.join(destDir, newName));
                    read.pipe(write);
                });
            }
            dbugmessage(`Images Copied to ServerFolder`)
        });
    }
}