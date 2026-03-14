import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useParentAuth } from '@/contexts/ParentAuthContext';
import { Lock } from 'lucide-react';

export default function ParentLoginModal() {
  const { login, loginModalOpen, closeLoginModal } = useParentAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }
    if (login(password)) {
      setPassword('');
    } else {
      setError('密码错误');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeLoginModal();
      setPassword('');
      setError('');
    }
  };

  return (
    <Dialog open={loginModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-fredoka text-xl">
            <Lock className="w-5 h-5" />
            家长登录
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">
          验证身份后可管理相册、每日计划等模块。
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">密码</label>
            <Input
              type="password"
              placeholder="请输入家长密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="font-mono"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full font-fredoka">
            登录
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
