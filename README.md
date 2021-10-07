# DailyQuests For Kovacs Altered Escape v2.0.7.1
------------------
Mod Version 1.0.4

## Installation
1. Extract archive to [ServerFolder] - `User/Mods/` 
    * Folder structure should look like [ServerFolder]/user/mods/AlteredEscape-DailyQuest-1.0.0
2. You must accept the terms to use this mod:
    * [IMPORTANT]
        This mod will copy files from its mod folder to the following in your [SeverFolder]
        * `src/images/`          - image files, needed for quests
        * `db/locales/en/`       - quest file, to maintain a clean copy of this fil
        * `user/profiles/`       - your profile, to remove expired daily quests
        * `user/cache/`          - cached files, to apply new quests and descriptions
        The images will be transferred into your [SeverFolder] `res/quest` folder
        deleting this mod will not automatically remove these images.
        keeping the images in the folder will cause no issues when the mod has been removed,
        however if you wish to completely remove all traces of this mod, you will need to manually
        delete these images.
        If you agree to allow these changes then please open the mod.config.json file
        at the very bottom, you must change Agree: `false` to Agree: `true`

## How to use Daily Quests Mod
After following the Installation guide, a new quest will be added to `Fence` every `24 hours` after you accept
the first quest, if you do not complete the previous quest, it will be deleted.

Currently there are three types of Quests:
1. Elimination
    * A target type will be randomly selected, see [Settings]
        * boss type will always have 10% chance, extra [Rewards] are applied for boss type Elimination
    * A random amount of kills required to complete this quest will be given, see [Settings]
    * [Rewards]
        * ₽5,000 Per PMC / SCAV kill
            * Bonus Random Weapon will be awarded to quests that have a high kill number
        * ₽20,000 Per Boss
            * Flea KeyCard
            * Bonus Random Weapon will be awarded to quests that have a high kill number
    * [Settings]
        * `enabled` - [false] will stop this quest type from being selected
        * `min` / `max` - [number] will dictate the minimum / maximum number of PMC / SCAV kills required.
        * `bossMin` / `bossMax` - [number] will dictate the minimum / maximum number of Boss kills required.
        * `Chances` 
            * `pmc` - [Percentage] adjusting this will change the chance of PMC vs SCAV selection. 45% is default

2. Fetch
    * A category will be randomly selected, see [Settings]
        * A random amount of items will be selected from the category, see [Settings]
            * A Random amount will be selected Per Item
    * It is optional if these items should be found in raid, see [Settings]
    * [Reward]
        * Market Value of the items in ₽ + ₽15,000 per Item if found, see [Settings]
        * Bonus Flea KeyCard will be awarded when the number of items to collect is high
        * Bonus Random Valuable Item will be awarded (25% Chance)
    * [Settings]
        * `enabled` - [false] will stop this quest type from being selected
        * `findFirst` - [false] will remove the requirement to find the item
        * `randomItems` - [true] will remove the category restriction, each item will be randomly selected
        * `min` / `max` - [number] will dictate the minimum / maximum number of items to select from categories.
        * `perItem`
            * `max` - [number] will dictate the maximum number of the selected items you must collect.

3. Contract
    * A target type will be randomly selected, see [Settings]
    * A random amount of kills required to complete this quest will be given, see [Settings]
    * A random weapon, or group of weapons will be chosen, these must be used to complete the task, see [Settings]
    * A Distance will be given, you must either be closer, or further away than the distance given, see [Settings]
    * A Time will be given, the contract must be executed during this time of day, see [Settings]
    * A random Chance that you will have to use silenced weapons, see [Settings]
    * [Disabled] A random chance that your weapon can not have a scope
    * Only a Head shot will count, see [Settings]
    * [Reward]
        * ₽10,000 - ₽35,000 Per kill
        * Flea KeyCard
        * Bonus Item will be awarded (25% Chance)
            * Either Random Weapon or Random Valuable Item
    * [Settings]
        * `enabled` - [false] will stop this quest type from being selected
        * `onlyBosses` - [true] will only select bosses as targets
        * `anyTime` - [true] will allow contracts to be carried out any time of the day
        * `anyDistance` - [true] will allow the target to be executed at any distance
        * `maxDistance` - [number] sets the maximum distance when deciding how far from the target you must be
        * `anyWeapon` - [true] will allow the contract to be carried out using any weapon
        * `onlyHead` - [false] will remove the requirement to execute the target with a head shot
        * `min` / `max` - [number] will dictate the minimum / maximum number of times you have to execute the target.
        * `chances`
            * `boss` - [percentage] adjusting this will change the chance of Boss selection. 33% is default

## Files
   * `AlteredEscape-DailyQuest/`
       * `files/`
           * `images/`          holds Images for the dynamic quests (contract) 
           * `blankQuest.json`  holds the template for the quest
           * `cleanQuest.json`  holds a clean copy of the default quest file
           * `conditions.json`  holds the condition templates
           * `dailyTimer.json`  holds the time to check if a new quest should be issued
           * `dialogue.json`    holds the dynamic dialogue
           * `fetch.json`       holds the categories and items for fetch quests
           * `lastquest.json`   holds a copy of the last quest
           * `lastquesten.json` holds a copy of the last dialogue and ids
           * `questDesc.json`   holds the template for quest descriptions
           * `weapon.json`      holds weapon information for rewards & contracts.
       * `src/`
           * `cache.js`         holds the code that executes when the mod runs
       * `mod.config.json`      holds the configuration details

## Broken?
check that [ServerFolder] - `user/config/server.json` rebuildCache is set to true.
make sure you have agreed to the terms.  see [installation]
Join the Altered Escape Discord: https://discord.gg/xAMfCGF4vb

