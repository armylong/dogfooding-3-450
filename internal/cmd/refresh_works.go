package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	libraryUtils "github.com/armylong/go-library/utils"
	"github.com/spf13/cobra"
)

func RefreshWorksHandler(cmd *cobra.Command, args []string) {

	worksPath := ""
	if len(args) > 0 {
		worksPath = args[0]
	} else {
		fmt.Println("错误: 请指定工作目录路径")
		return
	}

	hasFileNamesStr, _ := cmd.Flags().GetString("has_file_names")
	noHasFileNamesStr, _ := cmd.Flags().GetString("no_has_file_names")

	var hasFileNames []string
	if hasFileNamesStr != "" {
		hasFileNames = strings.Split(hasFileNamesStr, ",")
	}
	var noHasFileNames []string
	if noHasFileNamesStr != "" {
		noHasFileNames = strings.Split(noHasFileNamesStr, ",")
	} else {
		noHasFileNames = strings.Split(noHasFileNamesStr, ",")
	}

	sleepTime := 5 * time.Second

	for {
		entries, err := os.ReadDir(worksPath)
		if err != nil {
			fmt.Printf("工作目录不存在 %s: %v\n", worksPath, err)
			return
		}
		// fmt.Printf("工作目录 %s 子目录数量: %d\n", worksPath, len(entries))

		hasEmptyWork := false
		for _, entry := range entries {
			subdirPath := filepath.Join(worksPath, entry.Name())
			subEntries, err := os.ReadDir(subdirPath)
			if err != nil {
				fmt.Printf("读取子目录 %s 失败: %v\n", subdirPath, err)
				return
			}
			var subEntryHasList []string
			var subEntryNoHasList []string
			for _, subEntry := range subEntries {
				if libraryUtils.InArray(subEntry.Name(), hasFileNames) {
					subEntryHasList = append(subEntryHasList, subEntry.Name())
					continue
				}
				if libraryUtils.InArray(subEntry.Name(), noHasFileNames) {
					subEntryNoHasList = append(subEntryNoHasList, subEntry.Name())
					continue
				}
			}
			if len(subEntryHasList) == len(hasFileNames) && len(subEntryNoHasList) != len(noHasFileNames) {
				hasEmptyWork = true
				break
			}
		}
		if hasEmptyWork {
			fmt.Printf("[%s] 任务刷新成功\n", time.Now().Format("2006-01-02 15:04:05"))
			break
		} else {
			time.Sleep(sleepTime)
		}
	}
}
