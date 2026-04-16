package yangfen

import (
	"context"
	"fmt"
	"strconv"
	"sync"
	"testing"
	"time"

	yangfenModel "github.com/armylong/armylong-go/internal/model/yangfen"
)

func TestClearAllData(t *testing.T) {
	ctx := context.Background()

	for i := 1; i <= 20; i++ {
		uid := strconv.Itoa(i)
		YangfenBusiness.ClearData(ctx, uid)
	}

	t.Log("所有测试数据已清除")
}

func TestBug1_TransferConcurrency(t *testing.T) {
	ctx := context.Background()
	uid1 := "1"

	TestClearAllData(t)

	err := YangfenBusiness.Recharge(ctx, uid1, 100, 100)
	if err != nil {
		t.Fatalf("充值失败: %v", err)
	}

	balance, _ := YangfenBusiness.GetBalance(ctx, uid1)
	t.Logf("用户1充值后余额: %d", balance)

	transferCount := 10
	transferAmount := 20

	var wg sync.WaitGroup
	errs := make([]error, transferCount)

	wg.Add(transferCount)

	for i := 0; i < transferCount; i++ {
		go func(index int) {
			defer wg.Done()
			toUid := strconv.Itoa(index + 2)
			errs[index] = YangfenBusiness.Transfer(ctx, uid1, toUid, transferAmount)
		}(i)
	}

	wg.Wait()

	successCount := 0
	failCount := 0
	for _, e := range errs {
		if e == nil {
			successCount++
		} else {
			failCount++
		}
	}

	balance1, _ := YangfenBusiness.GetBalance(ctx, uid1)
	t.Logf("用户1最终余额: %d", balance1)

	totalReceived := 0
	for i := 2; i <= 11; i++ {
		uid := strconv.Itoa(i)
		b, _ := YangfenBusiness.GetBalance(ctx, uid)
		if b > 0 {
			t.Logf("用户%s余额: %d", uid, b)
			totalReceived += b
		}
	}

	t.Logf("成功转账: %d笔, 失败: %d笔", successCount, failCount)
	t.Logf("总转出金额: %d (原始余额100, 每笔%d)", totalReceived, transferAmount)

	if totalReceived > 100 {
		t.Errorf("Bug复现! 总转出金额%d超过原始余额100，数据不一致!", totalReceived)
	}
}

func TestBug2_RefundAfterExpire(t *testing.T) {
	ctx := context.Background()
	uid1 := "1"

	TestClearAllData(t)

	err := YangfenBusiness.Recharge(ctx, uid1, 100, 1)
	if err != nil {
		t.Fatalf("充值失败: %v", err)
	}

	balance, _ := YangfenBusiness.GetBalance(ctx, uid1)
	t.Logf("用户1充值后余额: %d (1秒后过期)", balance)

	err = YangfenBusiness.Consume(ctx, uid1, 50)
	if err != nil {
		t.Fatalf("消费失败: %v", err)
	}

	balance, _ = YangfenBusiness.GetBalance(ctx, uid1)
	t.Logf("消费50后余额: %d", balance)

	transactions, _ := YangfenBusiness.GetTransactions(ctx, uid1)
	var consumeTxId string
	for _, tx := range transactions {
		if tx["type"] == "consume" {
			consumeTxId = tx["id"].(string)
			break
		}
	}

	if consumeTxId == "" {
		t.Fatal("找不到消费记录")
	}
	t.Logf("消费交易ID: %s", consumeTxId)

	time.Sleep(2 * time.Second)
	t.Log("等待2秒，积分已过期")

	YangfenBusiness.Recharge(ctx, uid1, 0, 100)

	balance, _ = YangfenBusiness.GetBalance(ctx, uid1)
	t.Logf("过期后余额: %d (应该为0)", balance)

	err = YangfenBusiness.Refund(ctx, uid1, consumeTxId)
	if err != nil {
		t.Fatalf("退款失败: %v", err)
	}

	balance, _ = YangfenBusiness.GetBalance(ctx, uid1)
	t.Logf("退款后余额: %d", balance)

	if balance > 0 {
		t.Errorf("Bug复现! 积分已过期，但退款成功，用户凭空获得%d积分", balance)
	}
}

func TestBug3_ConsumeBonusNotApplied(t *testing.T) {
	ctx := context.Background()
	uid1 := "1"

	TestClearAllData(t)

	err := YangfenBusiness.Recharge(ctx, uid1, 200, 100)
	if err != nil {
		t.Fatalf("充值失败: %v", err)
	}

	balance, _ := YangfenBusiness.GetBalance(ctx, uid1)
	t.Logf("用户1充值后余额: %d", balance)

	err = YangfenBusiness.Consume(ctx, uid1, 100)
	if err != nil {
		t.Fatalf("消费失败: %v", err)
	}

	balance, _ = YangfenBusiness.GetBalance(ctx, uid1)
	t.Logf("消费100后余额: %d", balance)

	expectedWithBonus := 200
	if balance != expectedWithBonus {
		t.Errorf("Bug复现! 消费满100应获得双倍积分奖励，预期余额%d，实际余额%d", expectedWithBonus, balance)
	}
}

func TestBug4_TransactionNotClearedAfterExpire(t *testing.T) {
	ctx := context.Background()
	uid1 := "1"

	TestClearAllData(t)

	err := YangfenBusiness.Recharge(ctx, uid1, 100, 100)
	if err != nil {
		t.Fatalf("充值失败: %v", err)
	}

	balance, _ := YangfenBusiness.GetBalance(ctx, uid1)
	t.Logf("用户1充值后余额: %d", balance)

	transactions, _ := YangfenBusiness.GetTransactions(ctx, uid1)
	t.Logf("过期前交易记录数: %d", len(transactions))

	pastTime := time.Now().Add(-48 * time.Hour).Unix()
	row, _ := yangfenModel.TbYangfenBalanceModel.GetByUid(uid1)
	if row != nil {
		yangfenModel.TbYangfenBalanceModel.CreateOrUpdate(uid1, row.Balance, pastTime)
	}
	t.Log("已设置过期时间为48小时前")

	err = YangfenBusiness.Recharge(ctx, uid1, 0, 100)
	if err == nil {
		t.Log("充值0触发过期检查")
	}

	balance, _ = YangfenBusiness.GetBalance(ctx, uid1)
	transactions, _ = YangfenBusiness.GetTransactions(ctx, uid1)

	t.Logf("过期后余额: %d (预期为0)", balance)
	t.Logf("过期后交易记录数: %d (预期为0)", len(transactions))

	if balance == 0 && len(transactions) > 0 {
		t.Errorf("Bug复现! 余额已清零，但交易记录未清理，存在%d条记录", len(transactions))
	}
}

func TestAllBugs(t *testing.T) {
	fmt.Println("\n========== 清除测试数据 ==========")
	TestClearAllData(t)

	fmt.Println("\n========== Bug1: 转账并发问题 ==========")
	TestBug1_TransferConcurrency(t)

	fmt.Println("\n========== Bug2: 退款金额错误 ==========")
	TestBug2_RefundAfterExpire(t)

	fmt.Println("\n========== Bug3: 消费奖励未发放 ==========")
	TestBug3_ConsumeBonusNotApplied(t)

	fmt.Println("\n========== Bug4: 交易记录未清理 ==========")
	TestBug4_TransactionNotClearedAfterExpire(t)
}

func TestQueryUserTransactions(t *testing.T) {
	ctx := context.Background()
	uid := "1"

	fmt.Println("\n========== 查询用户1的交易记录 ==========")

	transactions, err := YangfenBusiness.GetTransactions(ctx, uid)
	if err != nil {
		t.Fatalf("查询失败: %v", err)
	}

	fmt.Printf("交易记录数: %d\n", len(transactions))
	for i, tx := range transactions {
		fmt.Printf("[%d] ID: %v, Type: %v, Amount: %v, Balance: %v, Desc: %v\n",
			i+1, tx["id"], tx["type"], tx["amount"], tx["balance"], tx["description"])
	}

	fmt.Println("\n========== 直接查询数据库 ==========")
	rows, err := yangfenModel.TbYangfenTransactionModel.ListByUid(uid, 100)
	if err != nil {
		t.Fatalf("直接查询失败: %v", err)
	}

	fmt.Printf("数据库记录数: %d\n", len(rows))
	for i, tx := range rows {
		fmt.Printf("[%d] ID: %d, TxID: %s, Type: %s, Amount: %d, Balance: %d, Desc: %s\n",
			i+1, tx.ID, tx.TransactionId, tx.Type, tx.Amount, tx.Balance, tx.Description)
	}
}
