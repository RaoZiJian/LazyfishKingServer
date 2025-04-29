const cors = require('cors');
const express = require('express');
const app = express();
const Account = require('./account');

const { MongoClient } = require('mongodb');

var dbUrl = "mongodb://localhost:27017";

exports.startServer = async function () {

  var account;

  // 初始化 MongoDB 连接
  const client = new MongoClient(dbUrl);
  await client.connect(dbUrl);
  const db = client.db("LazyFishKing");
  account = new Account(db);  // 使用引入的 Account 类
  // account.createAccountWithFakeData(db);// 创建一个假的账户

  // 服务器创建
  app.use(cors());
  app.use(express.json());

  // 接口路由
  app.get('/account', async (req, res) => {
    if (req.query.accountId) {
      var result = await account.getAccount(req.query.accountId);
      if (result.length > 0) {
        res.json({ success: true, account: result[0] });
      }else{
        res.json({ success: false, error: 'account not found' });
      }
    }else{
      res.json({ success: false, error: 'accountId is required' });
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
    }else{
      res.json({ success: false, error: 'accountId and level are required' });
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
    }else{
      res.json({ success: false, error: 'accountId and actorId are required' });
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
    }else{
      res.json({ success: false, error: 'accountId, itemId and amount are required' });
    }
  })
}

app.listen(8888, () => {
  console.log('Server is running on port 8888');
});

this.startServer();