#!/bin/bash
SCRIPT_DIR="$(dirname "$(realpath "$0")")"

for DIR in "$SCRIPT_DIR"/*/; do
    if [ -d "$DIR" ]; then
        echo "进入目录：$DIR"
        
        cd "$DIR" || continue
        if [ -f "package.json" ]; then
            echo "正在在 $DIR 执行 yarn local-install ..."
            yarn local-install
        else
            echo "$DIR 中未找到 package.json，跳过该目录。"
        fi
        
        cd "$SCRIPT_DIR" || exit
    fi
done
