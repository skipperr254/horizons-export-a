import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Trash2, UserCog, Shield, Edit3, Loader2, UserCheck, UserX } from 'lucide-react';

const UserActions = ({ user, onUpdateRole, onDeleteUser, onTogglePremium, isUpdating }) => {
  const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [isRoleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);

  const isSuperAdmin = user.email === 'mustafabayrak121@gmail.com';

  if (isSuperAdmin) {
    return (
      <Badge variant="secondary" className="border-green-600 text-green-700">
        <Shield className="h-3 w-3 mr-1" />
        Süper Admin
      </Badge>
    );
  }

  const handleDeleteConfirm = () => {
    onDeleteUser(user.id);
    setDeleteAlertOpen(false);
  };

  const handleRoleUpdateConfirm = () => {
    if (selectedRole !== user.role) {
      onUpdateRole(user.id, selectedRole);
    }
    setRoleDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isUpdating}>
            <span className="sr-only">Menüyü aç</span>
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onTogglePremium(user.id, user.subscription)}>
            {user.subscription ? (
              <UserX className="mr-2 h-4 w-4" />
            ) : (
              <UserCheck className="mr-2 h-4 w-4" />
            )}
            <span>{user.subscription ? 'Premium İptal' : 'Premium Yap'}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setRoleDialogOpen(true)}>
            <UserCog className="mr-2 h-4 w-4" />
            <span>Rolü Değiştir</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
            onClick={() => setDeleteAlertOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Kullanıcıyı Sil</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isRoleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rolü Değiştir</DialogTitle>
            <DialogDescription>
              <strong>{user.name || user.email}</strong> kullanıcısının rolünü değiştir. Bu işlem kullanıcının yetkilerini etkileyecektir.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Rol seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" /> Admin
                  </div>
                </SelectItem>
                <SelectItem value="content_creator">
                  <div className="flex items-center">
                    <Edit3 className="h-4 w-4 mr-2" /> İçerik Üreticisi
                  </div>
                </SelectItem>
                <SelectItem value="user">
                  <div className="flex items-center">
                    <UserCog className="h-4 w-4 mr-2" /> Kullanıcı
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>İptal</Button>
            <Button onClick={handleRoleUpdateConfirm} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. <strong>{user.name || user.email}</strong> kullanıcısı kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserActions;