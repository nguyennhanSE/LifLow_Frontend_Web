'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useUser } from '@/hooks/use-user/user.hook'
import { User } from '@/entities/user.entity'
import { ERoleName } from '@/entities/roles/role.enum'
import { EPermissionName } from '@/entities/permissions/permission.entity'
import { DialogDescription } from '@radix-ui/react-dialog'

type PermissionItem = {
  id: string
  name: string
  description: string
}

// Removed useUserFilter - filtering is now done on server side

export default function AdminPermissionsPage() {
  // State
  const { getAdminOnly, updateUserPermissions, addUser, getUserPermissions } = useUser();
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<ERoleName | 'ALL'>('ALL');
  const [debouncedRole, setDebouncedRole] = useState<ERoleName | 'ALL'>('ALL');
  const [hasUserScrolled, setHasUserScrolled] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    name: '',
    email: '',
    role: ERoleName.ADMIN as ERoleName,
    // phoneNumber: '',
  });
  
  const {
    data: usersData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery<User[]>({
    queryKey: ['users', debouncedQuery, debouncedRole],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const page = (pageParam as number) / 10 + 1;
        const params: any = {
          page,
          limit: 10,
        };
        
        // Add q (query) if debouncedQuery is not empty
        if (debouncedQuery.trim()) {
          params.q = debouncedQuery.trim();
        }
        
        // Add role if selectedRole is not 'ALL'
        if (debouncedRole && debouncedRole !== 'ALL') {
          params.role = debouncedRole;
        }
        
        const result = await getAdminOnly(params);
        
        return result.data;
      } catch (err) {
        throw err;
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const lastLength = Array.isArray(lastPage) ? (lastPage.length ?? 0) : 0;
      if (lastLength < 10) return undefined; // no more pages
      const safePages = Array.isArray(allPages) ? allPages : [];
      const nextOffset = safePages.reduce(
        (sum, page) => sum + (Array.isArray(page) ? (page.length ?? 0) : 0),
        0,
      );
      return nextOffset;
    },
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Flatten pages data
  const allUsers = useMemo(() => {
    if (!usersData?.pages) return [];
    return usersData.pages.flat();
  }, [usersData]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<
    Record<string, boolean>
  >({});
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [fetchedPermissions, setFetchedPermissions] = useState<EPermissionName[]>([]);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return allUsers.find((user) => user.id === selectedUserId);
  }, [selectedUserId, allUsers]);

  // Fetch and initialize editing permissions when user is selected
  useEffect(() => {
    if (selectedUserId) {
      const fetchPermissions = async () => {
        setIsLoadingPermissions(true);
        try {
          const permissions = await getUserPermissions(selectedUserId);
          setFetchedPermissions(permissions);
          
          // Initialize editing permissions based on fetched data
          const initialPermissions: Record<string, boolean> = {};
          Object.values(EPermissionName).forEach((perm) => {
            initialPermissions[perm] = permissions.includes(perm);
          });
          setEditingPermissions(initialPermissions);
        } catch (error) {
          console.error('Failed to fetch permissions:', error);
          // Fallback to empty permissions on error
          const initialPermissions: Record<string, boolean> = {};
          Object.values(EPermissionName).forEach((perm) => {
            initialPermissions[perm] = false;
          });
          setEditingPermissions(initialPermissions);
        } finally {
          setIsLoadingPermissions(false);
        }
      };
      
      fetchPermissions();
    } else {
      // Reset when dialog closes
      setEditingPermissions({});
      setFetchedPermissions([]);
    }
  }, [selectedUserId, getUserPermissions]);

  // Debounce keyword query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(keyword.trim());
    }, 500);
    return () => clearTimeout(handler);
  }, [keyword]);

  // Debounce role filter
  useEffect(() => {
    setDebouncedRole(selectedRole);
  }, [selectedRole]);

useEffect(() => {
    const onScroll = () => setHasUserScrolled(true);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
}, []);

useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasUserScrolled && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, { root: null, rootMargin: '0px', threshold: 0.25 });
    observer.observe(el);
    return () => {
        observer.unobserve(el);
        observer.disconnect();
    };
}, [bottomRef, hasUserScrolled, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    const permissionNames = Object.entries(editingPermissions)
      .filter(([_, enabled]) => enabled)
      .map(([perm]) => perm as EPermissionName);

    try {
      await updateUserPermissions(selectedUser.id, permissionNames);
      await refetch();
      setSelectedUserId(null);
    } catch (error) {
      console.error('Failed to update permissions:', error);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminForm.name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    try {
      await addUser({
        name: newAdminForm.name.trim(),
        email: newAdminForm.email.trim() || undefined,
        role: newAdminForm.role,
        // phoneNumber: newAdminForm.phoneNumber.trim() || undefined,
      });
      await refetch();
      setIsAddAdminDialogOpen(false);
      setNewAdminForm({
        name: '',
        email: '',
        role: ERoleName.ADMIN,
      });
      
    } catch (error) {
      console.error('Failed to add admin:', error);
      alert('관리자 추가에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header (matches Figma AdminPermissions header row) */}
      <section className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">권한 관리</h2>
          <p className="text-muted-foreground text-sm">
            전체 {total}명의 관리자
          </p>
        </div>

        <Dialog open={isAddAdminDialogOpen} onOpenChange={setIsAddAdminDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-black text-white hover:bg-black/90">
              <Plus className="mr-2 h-5 w-5" />
              관리자 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>관리자 추가</DialogTitle>
              <DialogDescription className='
              text-muted-foreground text-sm'>새로운 관리자 계정을 추가합니다</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">이름 *</Label>
                <Input
                  id="name"
                  placeholder="이름을 입력하세요"
                  value={newAdminForm.name}
                  onChange={(e) =>
                    setNewAdminForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={newAdminForm.email}
                  onChange={(e) =>
                    setNewAdminForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">역할</Label>
                <Select
                  value={newAdminForm.role}
                  onValueChange={(value) =>
                    setNewAdminForm((prev) => ({ ...prev, role: value as ERoleName }))
                  }
                >
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="역할을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ERoleName)
                      .filter((role) => role !== ERoleName.USER)
                      .map((role) => {
                        const label = role
                          .replace(/_/g, ' ')
                          .toLowerCase()
                          .replace(/\b\w/g, (letter: string) => letter.toUpperCase());
                        return (
                          <SelectItem key={role} value={role}>
                            {label}
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddAdminDialogOpen(false)}
              >
                취소
              </Button>
              <Button type="button" onClick={handleAddAdmin} className="bg-black text-white hover:bg-black/90">
                추가
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {/* Search / filter bar (Figma has a small control card above the table) */}
      <Card>
        <CardContent>
          {/* <CardTitle className="text-sm font-semibold">관리자 검색</CardTitle> */}
          <div className="flex flex-row items-center justify-between gap-2">
            <Input
              placeholder="이름, 이메일로 검색"
              className="flex-1"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as ERoleName | 'ALL')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                {Object.values(ERoleName).filter((role) => role !== ERoleName.USER).map((role) => {
                  const label = role
                    .replace(/_/g, ' ')
                    .toLowerCase()
                    .replace(/\b\w/g, (letter: string) => letter.toUpperCase());
                  return (
                    <SelectItem key={role} value={role}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Admin list table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">관리자 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">ID</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>역할</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-center">권한 설정</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-red-500">
                    오류가 발생했습니다: {error instanceof Error ? error.message : '알 수 없는 오류'}
                  </TableCell>
                </TableRow>
              ) : isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : allUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-center">
                      {user.id.slice(-8)}
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {user.roles?.[0]?.name || '역할 없음'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.situation === 'Active' ? 'secondary' : 'outline'
                        }
                      >
                        {user.situation === 'Active' ? '활성' : user.situation}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Dialog
                        open={selectedUserId === user.id}
                        onOpenChange={(open) => {
                          setSelectedUserId(open ? user.id : null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            권한 설정
                          </Button>
                        </DialogTrigger>
                        {selectedUser && selectedUser.id === user.id && (
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>권한 설정 - {user.name}</DialogTitle>
                              <DialogDescription className='
                              text-muted-foreground text-sm'>관리자의 메뉴별 접근 권한을 설정합니다</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-2">
                              {isLoadingPermissions ? (
                                <div className="text-center text-muted-foreground py-4">
                                  권한을 불러오는 중...
                                </div>
                              ) : (
                                <>
                                  {/* Header Row */}
                                  <div className="flex items-center justify-between border-b border-gray-200 pb-2 pr-4">
                                    <span className="text-sm font-medium">메뉴</span>
                                    <span className="text-sm font-medium">접근 가능</span>
                                  </div>

                                  {/* Permission Items */}
                                  <div className="space-y-0">
                                    {Object.values(EPermissionName).map((perm, index) => {
                                      const permissionLabels: Record<EPermissionName, string> = {
                                        [EPermissionName.DASHBOARD_ACCESS]: '대시보드',
                                        [EPermissionName.MEMBER_MANAGEMENT]: '회원 관리',
                                        [EPermissionName.PRODUCT_MANAGEMENT]: '상품 관리',
                                        [EPermissionName.ORDER_MANAGEMENT]: '주문 관리',
                                        [EPermissionName.RECIPE_MANAGEMENT]: '레시피 관리',
                                        [EPermissionName.BANNER_MANAGEMENT]: '배너 관리',
                                      };

                                      const isLast = index === Object.values(EPermissionName).length - 1;

                                      return (
                                        <div
                                          key={perm}
                                          className={`flex items-center justify-between py-2 pr-4 ${!isLast ? 'border-b border-gray-200' : ''}`}
                                        >
                                          <span className="text-sm">
                                            {permissionLabels[perm]}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={editingPermissions[perm] ?? false}
                                              onCheckedChange={(checked) =>
                                                setEditingPermissions((prev) => ({
                                                  ...prev,
                                                  [perm]: checked,
                                                }))
                                              }
                                              className="data-[state=checked]:bg-black!"
                                            />
                                            <span className="text-sm w-8">
                                              {editingPermissions[perm]
                                                ? 'ON'
                                                : ''}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Notes */}
                                  <div className="text-muted-foreground space-y-1 text-xs pt-2">
                                    <p>
                                      * 권한 관리 메뉴는 총괄 관리자만 접근 가능합니다
                                    </p>
                                    <p>
                                      * 대시보드는 모든 관리자가 기본 접근할 수 있습니다
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>

                            <DialogFooter className="gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSelectedUserId(null)}
                              >
                                취소
                              </Button>
                              <Button
                                type="button"
                                onClick={handleSavePermissions}
                                disabled={isLoadingPermissions}
                                className="bg-black text-white hover:bg-black/90"
                              >
                                저장
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Intersection observer target for infinite scroll */}
      <div ref={bottomRef} className="h-4" />
      
      {/* Load more button */}
      {/* {hasNextPage && (
        <div className="flex justify-center">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
          >
            {isFetchingNextPage ? '로딩 중...' : '더 보기'}
          </Button>
        </div>
      )} */}
    </div>
  )
}