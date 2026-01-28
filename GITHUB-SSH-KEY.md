# GitHub Actions：SSH 密钥配置

若报错 `Error loading key: error in libcrypto`，通常是密钥格式问题。

- **`SSH_PRIVATE_KEY`** 须为 **OpenSSH** 格式（含 `-----BEGIN ...` / `-----END ...`），不能用 PuTTY .ppk。
- .ppk 转 OpenSSH：`puttygen id_rsa.ppk -O private-openssh -o id_rsa_openssh`，再复制 `id_rsa_openssh` 全文到 Secret。
- 公钥需已加入服务器 `~/.ssh/authorized_keys`。
