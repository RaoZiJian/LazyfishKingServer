const cors = require('cors');
const express = require('express');
const app = express();
const Account = require('./account');

const { MongoClient } = require('mongodb');

var dbUrl = "mongodb://localhost:27017";

exports.startServer = async function () {

  var account;

  // 初始化 MongoDB 连接
  var db;
  await MongoClient.connect(dbUrl)
    .then(client => {
      db = client.db("LazyFishKing");
      account = new Account(db);  // 使用引入的 Account 类
      // account.createAccountWithFakeData(db);// 创建一个假的账户
      console.log('Connected to MongoDB');
    })
    .catch(error => console.error('MongoDB connection error:', error));

  // 服务器创建
  app.use(cors());
  app.use(express.json());

  // 接口路由
  app.post('/account', async (req, res) => {
    if (req.body.accountId) {
      var result = await account.getAccount(req.body.accountId);
      if (result.length > 0) {
        res.json(result[0]);
      }
    }
  });

  app.post('/account/updateLevel', async (req, res) => {
    if (req.body.accountId && req.body.level) {
      var result = await account.updateAccountLevel(req.body.accountId, req.body.level);
      if (result && result.accountId === req.body.accountId) {
        res.json({ success: true, account: result });
      } else {
        res.json({ success: false });
      }
    }
  })

  app.post('/account/updateActorLevel', async (req, res) => {
    if (req.body.accountId && req.body.actorId) {
      var result = await account.updateActorLevel(req.body.accountId, req.body.actorId);
      if (result && result.accountId === req.body.accountId) {
        res.json({ success: true, account: result });
      } else {
        res.json({ success: false });
      }
    }
  })

  app.post('/account/addItem', async (req, res) => {
    if (req.body.accountId && req.body.itemId && req.body.amount) {
      var result = await account.addAccountItem(req.body.accountId, req.body.itemId, req.body.amount);
      if (result && result.accountId === req.body.accountId) {
        res.json({ success: true, account: result });
      } else {
        res.json({ success: false });
      }
    }
  })
}

app.listen(8888, () => {
  console.log('Server is running on port 3000');
});

this.startServer();