import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Trash, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ChickenAccount } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function ChickenAccountsManager() {
  const [accounts, setAccounts] = useState<ChickenAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [importResults, setImportResults] = useState<{
    total: number;
    successful: number;
    duplicates: number;
  } | null>(null);

  // Statistics
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [usedAccounts, setUsedAccounts] = useState(0);
  const [availableAccounts, setAvailableAccounts] = useState(0);

  useEffect(() => {
    fetchChickenAccounts();
  }, [refreshTrigger]);

  const fetchChickenAccounts = async () => {
    setLoading(true);
    try {
      // Get all accounts for admin
      const { data, error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Database error:", error);
        throw error;
      }

      setAccounts(data || []);
      
      // Calculate statistics
      const total = data?.length || 0;
      const used = data?.filter(account => account.status === 'used').length || 0;
      const available = total - used;
      
      setTotalAccounts(total);
      setUsedAccounts(used);
      setAvailableAccounts(available);
    } catch (error) {
      console.error("Error fetching chicken accounts:", error);
      setError("ไม่สามารถดึงข้อมูลบัญชีไก่ตันได้");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!newUsername || !newPassword) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    setIsAddingAccount(true);
    setError(null);

    try {
      // Check if the username already exists
      const { data: existingAccounts, error: checkError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .select("id")
        .eq("username", newUsername);

      if (checkError) {
        throw checkError;
      }

      if (existingAccounts && existingAccounts.length > 0) {
        setError(`บัญชีผู้ใช้ "${newUsername}" มีอยู่ในระบบแล้ว`);
        setIsAddingAccount(false);
        return;
      }

      // Add new account with proper structure
      const { error: insertError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .insert([{
          username: newUsername,
          password: newPassword,
          status: 'available',
          used_by: null
        }]);

      if (insertError) {
        throw insertError;
      }

      setNewUsername("");
      setNewPassword("");
      setAddDialogOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error adding chicken account:", error);
      if (error instanceof Error) {
        setError(`ไม่สามารถเพิ่มบัญชีไก่ตันได้: ${error.message}`);
      } else {
        setError("ไม่สามารถเพิ่มบัญชีไก่ตันได้");
      }
    } finally {
      setIsAddingAccount(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkInput.trim()) {
      setError("กรุณากรอกข้อมูลบัญชี");
      return;
    }

    setIsBulkAdding(true);
    setError(null);
    // Reset import results
    setImportResults(null);

    try {
      // Clean the input - only allow basic ASCII characters and common delimiters
      const cleanInput = bulkInput
        .trim()
        .replace(/\r\n/g, '\n')
        .replace(/[^\x20-\x7E\n:,|]/g, ''); // Only allow ASCII printable chars and delimiters
      
      const lines = cleanInput.split('\n');
      
      // Parse all accounts first
      const accountsToAdd = [];
      const usernamesInBatch = new Set(); // To check for duplicates within the batch
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        // Skip empty lines
        if (!trimmedLine) {
          continue;
        }

        // Try to split by various delimiters
        let parts: string[] = [];
        
        if (trimmedLine.includes(':')) {
          parts = trimmedLine.split(':');
        } else if (trimmedLine.includes(',')) {
          parts = trimmedLine.split(',');
        } else if (trimmedLine.includes('|')) {
          parts = trimmedLine.split('|');
        } else if (trimmedLine.includes(' ')) {
          parts = trimmedLine.split(' ');
        } else {
          // If no common delimiters found, skip this line
          continue;
        }

        if (parts.length < 2) {
          continue;
        }

        const username = parts[0].trim();
        const password = parts[1].trim();

        if (!username || !password) {
          continue;
        }

        // Skip duplicates within the batch
        if (usernamesInBatch.has(username)) {
          continue;
        }
        
        usernamesInBatch.add(username);

        // Create account object that matches the new table structure
        accountsToAdd.push({
          username,
          password,
          status: 'available',
          used_by: null
        });
      }

      if (accountsToAdd.length === 0) {
        setError("ไม่พบข้อมูลบัญชีที่ถูกต้อง");
        setIsBulkAdding(false);
        return;
      }

      // Check for existing usernames in the database
      const usernamesToCheck = accountsToAdd.map(a => a.username);
      
      const { data: existingAccounts, error: checkError } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .select("username")
        .in("username", usernamesToCheck);

      if (checkError) {
        throw checkError;
      }

      // Create a set of existing usernames for quick lookup
      const existingUsernames = new Set((existingAccounts || []).map(a => a.username));
      
      // Filter out accounts that already exist in the database
      const uniqueAccounts = accountsToAdd.filter(account => !existingUsernames.has(account.username));
      
      const duplicateCount = accountsToAdd.length - uniqueAccounts.length;
      
      // Insert accounts in smaller batches for better reliability
      if (uniqueAccounts.length === 0) {
        setImportResults({
          total: accountsToAdd.length,
          successful: 0,
          duplicates: duplicateCount
        });
        setIsBulkAdding(false);
        return;
      }
      
      // Create smaller batches of 10 accounts each
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < uniqueAccounts.length; i += batchSize) {
        batches.push(uniqueAccounts.slice(i, i + batchSize));
      }
      
      let insertedCount = 0;
      
      for (const batch of batches) {
        const { error } = await supabase
          .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
          .insert(batch);

        if (error) {
          throw error;
        } else {
          insertedCount += batch.length;
        }
      }
      
      // Set final import results
      setImportResults({
        total: accountsToAdd.length,
        successful: insertedCount,
        duplicates: duplicateCount
      });
      
      setBulkInput("");
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error("Error bulk importing accounts:", error);
      if (error instanceof Error) {
        setError(`ไม่สามารถนำเข้าบัญชีไก่ตันได้: ${error.message}`);
      } else {
        setError("ไม่สามารถนำเข้าบัญชีไก่ตันได้");
      }
    } finally {
      setIsBulkAdding(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("คุณต้องการลบบัญชีนี้หรือไม่?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error deleting chicken account:", error);
      setError("ไม่สามารถลบบัญชีไก่ตันได้");
    }
  };

  const handleResetAccount = async (id: string) => {
    if (!confirm("คุณต้องการรีเซ็ตบัญชีนี้เพื่อนำกลับมาใช้งานอีกครั้งหรือไม่?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("app_9c8f2cf91bf942b2a7f12fc4c7ee9dc6_chicken_accounts")
        .update({
          status: 'available',
          used_by: null
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error resetting chicken account:", error);
      setError("ไม่สามารถรีเซ็ตบัญชีไก่ตันได้");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>จัดการบัญชีไก่ตัน</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {importResults && (
            <Alert className={`mb-4 ${importResults.successful > 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <AlertDescription>
                <p className="font-medium">ผลการนำเข้าบัญชี</p>
                <ul className="text-sm mt-1">
                  <li>นำเข้าสำเร็จ: {importResults.successful} บัญชี</li>
                  {importResults.duplicates > 0 && (
                    <li>มีบัญชีซ้ำในระบบ: {importResults.duplicates} บัญชี (ข้ามไป)</li>
                  )}
                  <li>รวมทั้งหมด: {importResults.total} บัญชี</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg flex-1 min-w-[200px]">
              <div className="text-2xl font-bold">{totalAccounts}</div>
              <div className="text-sm text-gray-500">บัญชีทั้งหมด</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg flex-1 min-w-[200px]">
              <div className="text-2xl font-bold text-green-600">{availableAccounts}</div>
              <div className="text-sm text-gray-500">บัญชีที่ใช้ได้</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg flex-1 min-w-[200px]">
              <div className="text-2xl font-bold text-gray-600">{usedAccounts}</div>
              <div className="text-sm text-gray-500">บัญชีที่ใช้ไปแล้ว</div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">รายการบัญชี</h3>
            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">นำเข้าหลายบัญชี</Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>นำเข้าบัญชีไก่ตันหลายรายการ</SheetTitle>
                    <SheetDescription>
                      วางข้อมูลบัญชีในรูปแบบ username:password (แต่ละบัญชีบรรทัดใหม่)
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bulk-accounts">ข้อมูลบัญชี</Label>
                      <textarea
                        id="bulk-accounts"
                        className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="username1:password1&#10;username2:password2&#10;username3:password3"
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        รองรับรูปแบบ username:password, username,password, username|password หรือ username password
                      </p>
                      <p className="text-xs text-gray-500 font-medium">
                        บัญชีที่มีชื่อผู้ใช้ (username) ซ้ำในระบบจะถูกข้ามโดยอัตโนมัติ
                      </p>
                    </div>
                    <Button 
                      onClick={handleBulkImport}
                      disabled={isBulkAdding}
                    >
                      {isBulkAdding ? "กำลังนำเข้า..." : "นำเข้าบัญชี"}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มบัญชี
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>เพิ่มบัญชีไก่ตัน</DialogTitle>
                    <DialogDescription>
                      กรอกข้อมูลบัญชีที่ต้องการเพิ่มในระบบ
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="username">ชื่อผู้ใช้</Label>
                      <Input
                        id="username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="username"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">รหัสผ่าน</Label>
                      <Input
                        id="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleAddAccount}
                      disabled={isAddingAccount}
                    >
                      {isAddingAccount ? "กำลังเพิ่ม..." : "เพิ่มบัญชี"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">กำลังโหลดข้อมูล...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อผู้ใช้</TableHead>
                    <TableHead>รหัสผ่าน</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>ผู้ใช้งาน</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        ไม่พบข้อมูลบัญชี
                      </TableCell>
                    </TableRow>
                  ) : (
                    accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.username}</TableCell>
                        <TableCell className="font-mono">{account.password}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              account.status === 'used'
                                ? "bg-gray-100 text-gray-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {account.status === 'used' ? "ใช้งานแล้ว" : "ว่าง"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {account.used_by ? account.used_by : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {account.status === 'used' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResetAccount(account.id)}
                              >
                                รีเซ็ต
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAccount(account.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}