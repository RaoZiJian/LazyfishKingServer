const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const exp = require('constants');

// 读取 JSON 配置文件
const gameConfig = JSON.parse(fs.readFileSync('./json/server/GameJsonCfg.json', 'utf8'));

// 定义 Account 类
class Account {
    constructor(db) {
        this.accountCollection = db.collection('Account');
    }

    // 创建带有假数据的 Account
    async createAccountWithFakeData() {
        // 从 Actor 表中获取不重复的 ActorId
        const actorIds = []; // 特殊 Actor 必须存在
        const availableActors = Object.values(gameConfig.Actor).filter(actor => actor.attackType != 3);

        while (actorIds.length < 5) {
            const randomActor = availableActors[Math.floor(Math.random() * availableActors.length)];
            if (!actorIds.includes(randomActor.id)) {
                actorIds.push(randomActor.id);
            }
        }

        const actors = actorIds.map(actorId => ({
            actorId,
            actorLevel: 1,
            exp: 0,
        }));

        // 初始化 Items，其中 ItemId 为 13 的代表金钱，其他道具数量为 0
        const items = Object.values(gameConfig.Item).map(item => ({
            itemId: item.id,
            itemAmount: item.id === 13 ? Math.floor(Math.random() * 1000) + 100 : 0 // 金钱的初始数量随机生成
        }));

        // 创建 Account 数据
        const fakeAccount = {
            accountId: uuidv4(),
            name: `Account_${Math.floor(Math.random() * 1000)}`,
            avatar: 'fishes/Avatars/wolf',
            level: 1,
            exp: 0,
            actors,
            bags: items
        };

        // 存储到数据库
        const result = await this.accountCollection.insertOne(fakeAccount);
        return result.insertedId;
    }

    // 获取 Account
    async getAccount(id) {
        return await this.accountCollection.find({ accountId: id }).toArray();
    }

    // 获取当前金钱
    async getMoney(account) {
        if (account) {
            return account.bags.find(item => item.itemId === 13).itemAmount;
        }
    }

    //玩家升级
    async updateAccountLevel(accountId, level) {
        var account = await this.getAccount(accountId);
        if (account.length > 0) {
            var currentLevel = account[0].level;
            var currentMoney = await this.getMoney(account[0]);
            var currentExp = account[0].exp;
            var levelUpCost = this.getLevelUpCost(currentLevel, currentExp);
            if (levelUpCost <= currentMoney) {
                return await this.accountCollection.findOneAndUpdate(
                    { accountId: accountId },
                    {
                        $set: { level: level, exp: 0 },
                        $set: { 'bags.$[item].itemAmount': currentMoney - levelUpCost },
                    },
                    { arrayFilters: [{ 'item.itemId': 13 }] },
                    { lastmodDate: new Date() }
                );
            } else {
                return false;
            }
        }
    }

    async updateActorLevel(accountId, actorId) {
        var account = await this.getAccount(accountId);
        if (account.length > 0) {
            var ator = account[0].actors.find(actor => actor.actorId === actorId);
            var currentLevel = ator.actorLevel;
            var currentExp = ator.exp;
            var levelUpCost = this.getActorLevelUpCost(actorId, currentLevel, currentExp);
            if (levelUpCost <= account[0].bags.find(item => item.itemId === 13).itemAmount) {
                return await this.accountCollection.findOneAndUpdate(
                    { accountId: accountId },
                    {
                        $set: {
                            'actors.$[actor].actorLevel': currentLevel + 1,
                            'actors.$[actor].exp': 0,
                            'bags.$[item].itemAmount': account[0].bags.find(item => item.itemId === 13).itemAmount - levelUpCost,
                            lastmodDate: new Date()
                        },
                    },
                    {
                        arrayFilters: [
                            { 'actor.actorId': actorId }, // 过滤 actors 数组中的目标 actor
                            { 'item.itemId': 13 }        // 过滤 bags 数组中的目标 item
                        ],
                        returnDocument: 'after', // 返回更新后的文档（可选，根据需求设置）
                    }
                );
            } else {
                return false;
            }
        }

    }

    //更新经验
    async updateAccountExp(accountId, exp) {
        return await this.updateAccount(accountId, { exp: exp });
    }

    // 增加道具
    async addAccountItem(accountId, itemId, itemAmount) {
        return await this.accountCollection.findOneAndUpdate(
            { accountId: accountId },
            {
                $inc: { 'bags.$[item].itemAmount': itemAmount },
            },
            { arrayFilters: [{ 'item.itemId': itemId }] },
            { lastmodDate: new Date() }
        )
    }

    // 更新 Account
    async updateAccount(accountId, data) {
        const result = await this.accountCollection.updateOne(
            { accountId: accountId },
            data,
            { lastmodDate: new Date() }
        );
        return result.modifiedCount;
    }

    // 删除 Account
    async deleteAccount(accountId) {
        const result = await this.accountCollection.deleteOne({ accountId });
        return result.deletedCount;
    }

    getLevelUpCost(level, exp) {
        var playerLevelCfg = gameConfig.PlayerLevel;
        if (playerLevelCfg && playerLevelCfg[level] && playerLevelCfg[level + 1]) {
            const currentLevelCfg = playerLevelCfg[level];
            const nextLevelCfg = playerLevelCfg[level + 1];
            const neededExp = (nextLevelCfg.exp - currentLevelCfg.exp) - exp;
            return neededExp / (nextLevelCfg.exp - currentLevelCfg.exp) * nextLevelCfg.cost;
        }
        return false;
    }

    getActorLevelUpCost(actorId, level, exp) {
        let levelCfg = gameConfig.Level;
        let nextLevel = level + 1;
        if (levelCfg && levelCfg[level] && levelCfg[level + 1]) {
            const currentLevelCfg = levelCfg[level];
            const nextLevelCfg = levelCfg[level + 1];
            const neededExp = (nextLevelCfg.exp - currentLevelCfg.exp) - exp;
            return neededExp / (nextLevelCfg.exp - currentLevelCfg.exp) * nextLevelCfg.cost;
        }

        return false;
    }
}


module.exports = Account;