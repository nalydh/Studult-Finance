"use client";

import React, { useState, useEffect, FormEvent } from "react";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Landmark, Banknote, TrendingUp, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api";

/* ── Types ── */
interface Account {
  id: number;
  name: string;
  category: string;
  balance: number;
}

const CATEGORY_OPTIONS = ["Cash", "Investment", "Liability"] as const;

const CATEGORY_STYLE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Cash: {
    bg: "bg-emerald-100 dark:bg-emerald-950",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: <Banknote className="h-3 w-3" />,
  },
  Investment: {
    bg: "bg-blue-100 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-300",
    icon: <TrendingUp className="h-3 w-3" />,
  },
  Liability: {
    bg: "bg-red-100 dark:bg-red-950",
    text: "text-red-700 dark:text-red-300",
    icon: <CreditCard className="h-3 w-3" />,
  },
};

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2 });
}

/* ══════════════════════════════════════════════════════════════════ */

export default function AccountLedger() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* ── Dialog state ── */
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  /* ── Add form state ── */
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newBalance, setNewBalance] = useState("");

  /* ── Edit form state ── */
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editBalance, setEditBalance] = useState("");

  // ─── Fetch ────────────────────────────────────────────────────────
  async function fetchAccounts() {
    try {
      const res = await fetch(`${API_BASE}/accounts/`);
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchAccounts(); }, []);

  // ─── Add ──────────────────────────────────────────────────────────
  function resetAddForm() {
    setNewName("");
    setNewCategory("");
    setNewBalance("");
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newCategory || !newBalance) return;
    try {
      const res = await fetch(`${API_BASE}/accounts/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          category: newCategory,
          balance: parseFloat(newBalance),
        }),
      });
      if (!res.ok) throw new Error("Failed to create account");
      resetAddForm();
      setAddOpen(false);
      fetchAccounts();
    } catch (err) {
      console.error("Error adding account:", err);
    }
  }

  // ─── Edit ─────────────────────────────────────────────────────────
  function openEdit(account: Account) {
    setEditingAccount(account);
    setEditName(account.name);
    setEditCategory(account.category);
    setEditBalance(account.balance.toString());
    setEditOpen(true);
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingAccount || !editName.trim() || !editCategory || !editBalance) return;
    try {
      const res = await fetch(`${API_BASE}/accounts/${editingAccount.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          category: editCategory,
          balance: parseFloat(editBalance),
        }),
      });
      if (!res.ok) throw new Error("Failed to update account");
      setEditOpen(false);
      setEditingAccount(null);
      fetchAccounts();
    } catch (err) {
      console.error("Error editing account:", err);
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API_BASE}/accounts/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      setDeleteTarget(null);
      fetchAccounts();
    } catch (err) {
      console.error("Error deleting account:", err);
    }
  }

  // ─── Computed ─────────────────────────────────────────────────────
  const totalCash = accounts
    .filter((a) => a.category === "Cash")
    .reduce((s, a) => s + a.balance, 0);
  const totalInvestments = accounts
    .filter((a) => a.category === "Investment")
    .reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = accounts
    .filter((a) => a.category === "Liability")
    .reduce((s, a) => s + a.balance, 0);

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Financial Accounts
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {accounts.length} account{accounts.length !== 1 && "s"}
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Account
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Summary metrics ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Banknote className="h-3.5 w-3.5 text-emerald-500" /> Total Cash
            </p>
            <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              ${fmt(totalCash)}
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> Total Investments
            </p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              ${fmt(totalInvestments)}
            </p>
          </div>
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CreditCard className="h-3.5 w-3.5 text-red-500" /> Total Liabilities
            </p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">
              ${fmt(totalLiabilities)}
            </p>
          </div>
        </div>

        {/* ── Table ── */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading…</p>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Landmark className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No accounts yet</p>
            <p className="text-sm mt-1">Click &quot;Add Account&quot; to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => {
                const style = CATEGORY_STYLE[account.category] ?? CATEGORY_STYLE.Cash;
                return (
                  <TableRow key={account.id} className="group">
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                        style.bg, style.text,
                      )}>
                        {style.icon}
                        {account.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${fmt(account.balance)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="sm" className="h-7 w-7 p-0"
                          onClick={() => openEdit(account)}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(account)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* ════════════════════ Add Account Dialog ════════════════════ */}
      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) resetAddForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="acc-name">Name</Label>
              <Input
                id="acc-name"
                placeholder="e.g. CommBank Everyday"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <span className="flex items-center gap-2">
                        {CATEGORY_STYLE[cat].icon}
                        {cat}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-balance">Balance</Label>
              <Input
                id="acc-balance"
                type="number"
                step="0.01"
                min="0"
                prefix="$"
                placeholder="0.00"
                value={newBalance}
                onChange={(e) => setNewBalance(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={!newName.trim() || !newCategory || !newBalance}>
                Add Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════ Edit Account Dialog ═══════════════════ */}
      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditingAccount(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingAccount?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-acc-name">Name</Label>
              <Input
                id="edit-acc-name"
                placeholder="e.g. CommBank Everyday"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <span className="flex items-center gap-2">
                        {CATEGORY_STYLE[cat].icon}
                        {cat}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-acc-balance">Balance</Label>
              <Input
                id="edit-acc-balance"
                type="number"
                step="0.01"
                min="0"
                prefix="$"
                placeholder="0.00"
                value={editBalance}
                onChange={(e) => setEditBalance(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={!editName.trim() || !editCategory || !editBalance}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ════════════════════ Delete Confirm Dialog ═════════════════ */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium">{deleteTarget?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span>{deleteTarget.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-medium">${fmt(deleteTarget.balance)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
