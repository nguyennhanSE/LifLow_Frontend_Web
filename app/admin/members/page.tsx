'use client'

import { useMemo, useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Monitor, Settings } from 'lucide-react'
import { User } from '@/entities/user.entity'
import { MembershipLevel, EMembershipStatus } from '@/entities/membership.entity'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useUser } from '@/hooks/use-user/user.hook'
import { useMembership } from '@/hooks/use-membership/membership.hook'
import { Membership } from '@/entities/membership.entity'
import { BulkUpdateMembershipItemDto } from '@/hooks/use-membership/membership.dto'
import { GetUsersQueryDto } from '@/hooks/use-user/user.dto'
import { toast } from '@/hooks/use-toast'
import { PaginationButton } from '@/components/common/PaginationButton'

const gradeOptions = [MembershipLevel.LV1, MembershipLevel.LV2, MembershipLevel.LV3, MembershipLevel.LV4, MembershipLevel.LV5] as readonly MembershipLevel[]

function formatCurrency(value: number) {
  return value.toLocaleString('ko-KR')
}

export default function AdminMembersPage() {
  const { getUsers } = useUser();
  const { updateUserMembership, getMembership, bulkUpdateMembership, recalculateMembership } = useMembership();
  const { updateUser } = useUser();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedNickname, setSelectedNickname] = useState<string>('ALL');
  const [debouncedNickname, setDebouncedNickname] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'normal' | 'inactive' | 'stop'>('ALL');
  const [debouncedStatus, setDebouncedStatus] = useState<'ALL' | 'normal' | 'inactive' | 'stop'>('ALL');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [gradeMemo, setGradeMemo] = useState('');
  const [selectedMembershipLevel, setSelectedMembershipLevel] = useState<string>('');
  const [selectedMembershipStatus, setSelectedMembershipStatus] = useState<string>(EMembershipStatus.ACTIVE);
  const [selectedAvailablePoints, setSelectedAvailablePoints] = useState<number>(0);
  const [initialMembershipLevel, setInitialMembershipLevel] = useState<string>('');
  const [initialMembershipStatus, setInitialMembershipStatus] = useState<string>(EMembershipStatus.ACTIVE);
  const [initialAvailablePoints, setInitialAvailablePoints] = useState<number>(0);
  const [gradeSettingsDialogOpen, setGradeSettingsDialogOpen] = useState(false);
  const [membershipSettings, setMembershipSettings] = useState<Record<string, { nickName: string; minPrice: string }>>({});
  const [basePeriod, setBasePeriod] = useState<string>('3');
  
  // Query to fetch membership data
  const { data: membershipsData, isLoading: isMembershipsLoading } = useQuery<Membership[]>({
    queryKey: ['memberships'],
    queryFn: async () => {
      const result = await getMembership(1, 10);
      return result;
    },
    enabled: true,
  });

  // Options match user.membership.name / user.membership.membershipName (e.g. "LV1. 씨앗")
  const membershipNicknameOptions = useMemo(() => {
    if (!membershipsData || membershipsData.length === 0) return [];
    return Array.from(
      new Set(
        membershipsData
          .map((m) => m.nickName ?? m.name ?? (m as { membershipName?: string }).membershipName)
          .filter((v): v is string => Boolean(v && v.trim())),
      ),
    ).sort();
  }, [membershipsData]);

  const membershipRuleLines = useMemo(() => {
    if (!membershipsData || membershipsData.length === 0) return [];

    const items = membershipsData
      .map((m) => {
        const settings = membershipSettings[m.id];
        const minPriceRaw = settings?.minPrice ?? String(m.minPrice ?? 0);
        const minPrice = Number(minPriceRaw);
        return {
          name: settings?.nickName ?? m.nickName ?? m.name,
          minPrice: Number.isFinite(minPrice) ? minPrice : 0,
        };
      })
      .sort((a, b) => a.minPrice - b.minPrice);

    if (items.length === 1) {
      return [`${items[0].name}: ${formatCurrency(items[0].minPrice)}원 이상`];
    }

    const lines: string[] = [];
    // From highest down to second-lowest: ">= minPrice"
    for (let i = items.length - 1; i >= 1; i--) {
      lines.push(`${items[i].name}: ${formatCurrency(items[i].minPrice)}원 이상`);
    }
    // Lowest: "< next minPrice"
    lines.push(`${items[0].name}: ${formatCurrency(items[1].minPrice)}원 미만`);
    return lines;
  }, [membershipsData, membershipSettings]);

  const {
    data: usersResult,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['members', page, limit, debouncedQuery, debouncedNickname, debouncedStatus],
    queryFn: async () => {
      const params: GetUsersQueryDto = { page, limit };
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
      if (debouncedNickname && debouncedNickname !== 'ALL') params.nickName = debouncedNickname;
      if (debouncedStatus && debouncedStatus !== 'ALL') params.status = debouncedStatus;
      return getUsers(params);
    },
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });

  const allMembers = usersResult?.data ?? [];
  const total = usersResult?.total ?? 0;
  const totalPages = usersResult?.pagination?.totalPages ?? 1;

  const selectedMember = useMemo(() => {
    if (!selectedMemberId) return null;
    return allMembers.find((m) => m.id === selectedMemberId);
  }, [selectedMemberId, allMembers]);

  // Initialize membership settings when memberships data is loaded
  useEffect(() => {
    if (membershipsData && membershipsData.length > 0) {
      const settings: Record<string, { nickName: string; minPrice: string }> = {};
      membershipsData.forEach((membership) => {
        settings[membership.id] = {
          nickName: membership.nickName || membership.name,
          minPrice: String(membership.minPrice ?? 0),
        };
      });
      setMembershipSettings(settings);
      // Set basePeriod from first membership or default to 3
      if (membershipsData[0]?.basePeriod) {
        setBasePeriod(membershipsData[0].basePeriod.toString());
      }
    }
  }, [membershipsData]);

  // Initialize selected membership level and status when member is selected
  useEffect(() => {
    if (selectedMember) {
      // Set membership level - ensure it matches one of the gradeOptions
      const membershipLevel = selectedMember.membership?.name || selectedMember.membershipLevel || '';
      const validLevel = (gradeOptions as readonly string[]).includes(membershipLevel) ? membershipLevel : gradeOptions[0];
      setSelectedMembershipLevel(validLevel);
      setInitialMembershipLevel(validLevel); // Save initial value

      // Set membership status - ensure it matches one of the EMembershipStatus values
      const membershipStatus = (selectedMember.membership as any)?.status;
      const statusValues = Object.values(EMembershipStatus) as string[];
      let validStatus: string;
      if (membershipStatus && statusValues.includes(membershipStatus)) {
        validStatus = membershipStatus;
      } else {
        // Fallback to situation field
        validStatus = selectedMember.situation === 'Active' ? EMembershipStatus.ACTIVE : EMembershipStatus.INACTIVE;
      }
      setSelectedMembershipStatus(validStatus);
      setInitialMembershipStatus(validStatus); // Save initial value
      setSelectedAvailablePoints(selectedMember.availablePoints);
      setInitialAvailablePoints(selectedMember.availablePoints);
    } else {
      // Reset values when no member is selected
      setSelectedMembershipLevel('');
      setSelectedMembershipStatus(EMembershipStatus.ACTIVE);
      setInitialMembershipLevel('');
      setInitialMembershipStatus(EMembershipStatus.ACTIVE);
      setSelectedAvailablePoints(0);
      setInitialAvailablePoints(0);
    }
  }, [selectedMember]);

  // Mutation for updating membership
  const updateMembershipMutation = useMutation({
    mutationFn: async ({ userId, level, membershipStatus, points }: { userId: string; level?: string; membershipStatus?: EMembershipStatus; points?: number }) => {
      const membershipDto: Parameters<typeof updateUserMembership>[1] = {};
      if (level !== undefined) {
        membershipDto.membershipLevel = level;
      }
      if (membershipStatus !== undefined) {
        membershipDto.status = membershipStatus;
      }

      const userDto: Parameters<typeof updateUser>[0] = {};
      if (points !== undefined) {
        userDto.availablePoints = points;
      }
      if (membershipStatus !== undefined) {
        userDto.membershipStatus = membershipStatus;
      }
      await updateUserMembership(userId, membershipDto);
      await updateUser(userDto, userId);
    },
    onSuccess: () => {
      // Invalidate and refetch members list
      queryClient.invalidateQueries({ queryKey: ['members'] });
      // Close dialog
      setSelectedMemberId(null);
    },
    onError: (error) => {
      console.error('Failed to update membership:', error);
      // You can add toast notification here if needed
    },
  });

  // Mutation for bulk updating memberships
  const bulkUpdateMembershipMutation = useMutation({
    mutationFn: async (updates: BulkUpdateMembershipItemDto[]) => {
      return await bulkUpdateMembership(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      setGradeSettingsDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to bulk update memberships:', error);
    },
  });

  const recalculateMembershipMutation = useMutation({
    mutationFn: async () => {
      return await recalculateMembership();
    },
    onSuccess: () => {
      toast({
        title: '등급 자동 변경 완료',
        description: '회원 등급이 최신 기준으로 자동 재산정되었습니다.',
      });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      refetch();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '알 수 없는 오류';
      toast({
        title: '등급 자동 변경 실패',
        description: message,
      });
    },
    onSettled: () => {
      // Close modal after the request finishes (success or error)
      setRuleDialogOpen(false);
    },
  });

  // Handle save button click
  const handleSave = () => {
    if (!selectedMember) return;

    const hasLevelChanged = selectedMembershipLevel !== initialMembershipLevel;
    const hasStatusChanged = selectedMembershipStatus !== initialMembershipStatus;
    const hasPointsChanged = selectedAvailablePoints !== initialAvailablePoints;

    // Only update if there are changes
    if (hasLevelChanged || hasStatusChanged || hasPointsChanged) {
      // Send current values to ensure data consistency
      updateMembershipMutation.mutate({
        userId: selectedMember.id,
        level: selectedMembershipLevel,
        membershipStatus: selectedMembershipStatus as EMembershipStatus,
        points: selectedAvailablePoints,
      });
    } else {
      // No changes, just close dialog
      setSelectedMemberId(null);
    }
  };

  // Handle increase points
  const handleIncreasePoints = () => {
    setSelectedAvailablePoints((prev) => prev + 1);
  };

  // Handle decrease points
  const handleDecreasePoints = () => {
    setSelectedAvailablePoints((prev) => Math.max(0, prev - 1));
  };

  // Handle save grade settings
  const handleSaveGradeSettings = () => {
    if (!membershipsData) return;

    const basePeriodValue = parseInt(basePeriod || '3', 10);
    const updates: BulkUpdateMembershipItemDto[] = membershipsData.map((membership) => {
      const settings = membershipSettings[membership.id];
      return {
        membershipId: membership.id,
        nickName: settings?.nickName || membership.nickName || membership.name,
        minPrice: parseFloat(settings?.minPrice || '0'),
        basePeriod: basePeriodValue,
      };
    });

    bulkUpdateMembershipMutation.mutate(updates);
  };

  // Handle membership setting change
  const handleMembershipSettingChange = (
    membershipId: string,
    field: 'nickName' | 'minPrice',
    value: string
  ) => {
    setMembershipSettings((prev) => ({
      ...prev,
      [membershipId]: {
        ...prev[membershipId],
        [field]: value,
      },
    }));
  };

  // Debounce keyword query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(keyword.trim());
    }, 500);
    return () => clearTimeout(handler);
  }, [keyword]);

  // Debounce nickname filter
  useEffect(() => {
    setDebouncedNickname(selectedNickname);
  }, [selectedNickname]);

  // Debounce status filter
  useEffect(() => {
    setDebouncedStatus(selectedStatus);
  }, [selectedStatus]);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, debouncedNickname, debouncedStatus]);

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">회원 관리</h2>
          <p className="text-muted-foreground text-sm">
            전체 {total}명의 회원
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setGradeSettingsDialogOpen(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            등급 설정
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRuleDialogOpen(true)}
          >
            <Monitor className="h-4 w-4 mr-2" />
            {basePeriod || '3'}개월 실결제 기준 등급 자동 변경
          </Button>
        </div>

        <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{basePeriod || '3'}개월 실결제 기준 등급 자동 변경</DialogTitle>
              <DialogDescription>
                최근 {basePeriod || '3'}개월 실결제 금액을 기준으로 회원 등급을 자동으로 변경합니다
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-md bg-muted px-4 py-3 text-sm leading-relaxed">
              <p className="font-medium mb-2">등급 기준</p>
              {isMembershipsLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner className="h-5 w-5" />
                </div>
              ) : membershipRuleLines.length > 0 ? (
                <div className="space-y-1">
                  {membershipRuleLines.map((line) => (
                    <p key={line}>- {line}</p>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">등급 기준 정보를 불러오지 못했습니다.</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              이 작업은 모든 회원의 등급을 자동으로 재산정합니다. 계속하시겠습니까?
            </p>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setRuleDialogOpen(false)}>
                취소
              </Button>
              <Button
                type="button"
                onClick={() => recalculateMembershipMutation.mutate()}
                disabled={recalculateMembershipMutation.isPending}
                className="bg-red-500 hover:bg-red-600"
              >
                {recalculateMembershipMutation.isPending && (
                  <Spinner className="mr-2 h-4 w-4" />
                )}
                등급 자동 변경 실행
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Grade Settings Dialog */}
        <Dialog open={gradeSettingsDialogOpen} onOpenChange={setGradeSettingsDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>회원 등급 설정</DialogTitle>
              <DialogDescription>
                등급 이름과 실결제 기준 금액을 설정합니다
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {isMembershipsLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner className="h-6 w-6" />
                </div>
              ) : (
                <>
                  {/* Base Period Section */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">기준 기간 (개월)</Label>
                    <Input
                      type="text"
                      value={basePeriod}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setBasePeriod(value);
                      }}
                      placeholder="3"
                      className="bg-gray-100"
                    />
                    <p className="text-sm text-muted-foreground">
                      최근 {basePeriod || '3'}개월 실결제 금액을 기준으로 등급을 산정합니다
                    </p>
                  </div>

                  {/* Membership Levels Section */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">등급별 설정</Label>
                    {membershipsData && membershipsData.length > 0 ? (
                      <div className="space-y-3">
                        {membershipsData.map((membership) => {
                          const settings =
                            membershipSettings[membership.id] || {
                              nickName: membership.nickName || membership.name,
                              minPrice: String(membership.minPrice ?? 0),
                            };
                          
                          // Level colors:
                          // - Level1 (GENERAL): gray-100
                          // - Level2 (SILVER): gray-300
                          // - Level3 (GOLD): yellow
                          // - Level4 (VIP): purple
                          // - Level5 (VVIP): pink
                          const levelInfo = {
                            'LV1. 씨앗': { bg: 'bg-gray-100', badge: '!bg-gray-100 font-medium !text-gray-700 !border-gray-300' },
                            'LV2. 새싹': { bg: 'bg-gray-300', badge: '!bg-gray-300 font-medium !text-gray-900 !border-gray-400' },
                            'LV3. 열매': { bg: 'bg-yellow-100', badge: '!bg-yellow-100 font-medium !text-yellow-800 !border-yellow-300' },
                            'LV4. 나무': { bg: 'bg-purple-100', badge: '!bg-purple-100 font-medium !text-purple-700 !border-purple-300' },
                            'LV5. 정원': { bg: 'bg-pink-100', badge: '!bg-pink-100 font-medium !text-pink-700 !border-pink-300' },
                          }[membership.name] ?? {
                            bg: 'bg-gray-100',
                            badge: '!bg-gray-100 font-medium !text-gray-700 !border-gray-300'
                          };

                          return (
                            <div key={membership.id} className={`border rounded-lg p-4 space-y-3`}>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={levelInfo.badge}>
                                  {settings.nickName}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">
                                  등급명
                                </Label>
                                <Input
                                  value={settings.nickName}
                                  onChange={(e) =>
                                    handleMembershipSettingChange(membership.id, 'nickName', e.target.value)
                                  }
                                  className="bg-white"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label className="text-sm text-muted-foreground">
                                  최소 금액 (원)
                                </Label>
                                <Input
                                  type="text"
                                  value={settings.minPrice}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    handleMembershipSettingChange(membership.id, 'minPrice', value);
                                  }}
                                  placeholder="0"
                                  className="bg-white"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        등급 정보가 없습니다
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    아래 등급은 제외 기준 (최근 {basePeriod || '3'}개월 기준 자동 설정)
                  </p>
                </>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  // Reset inputs to initial values from membershipsData
                  if (membershipsData && membershipsData.length > 0) {
                    const settings: Record<string, { nickName: string; minPrice: string }> = {};
                    membershipsData.forEach((membership) => {
                      settings[membership.id] = {
                        nickName: membership.nickName || membership.name || '',
                        minPrice: String(membership.minPrice ?? 0),
                      };
                    });
                    setMembershipSettings(settings);
                    setBasePeriod(membershipsData[0]?.basePeriod != null ? String(membershipsData[0].basePeriod) : '3');
                  }
                  setGradeSettingsDialogOpen(false);
                }}
              >
                취소
              </Button>
              <Button 
                type="button"
                onClick={handleSaveGradeSettings}
                disabled={bulkUpdateMembershipMutation.isPending}
                className="bg-red-500 hover:bg-red-600"
              >
                {bulkUpdateMembershipMutation.isPending && (
                  <Spinner className="mr-2 h-4 w-4" />
                )}
                저장
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      <Card>
        <CardContent>
          <div className="flex flex-row items-center justify-between gap-2">
            <Input
              placeholder="이름, 아이디, 이메일, 전화번호로 검색"
              className="flex-1"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {/* Filters by membership.name / membership.membershipName (e.g. "LV1. 씨앗") */}
            <Select value={selectedNickname} onValueChange={(value) => setSelectedNickname(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="닉네임 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                {membershipNicknameOptions.map((nick) => (
                  <SelectItem key={nick} value={nick}>
                    {nick}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filters by membership.status (normal | inactive | stop) */}
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as 'ALL' | 'normal' | 'inactive' | 'stop')}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="normal">정상</SelectItem>
                <SelectItem value="inactive">휴면</SelectItem>
                <SelectItem value="stop">중지</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        {/* <CardHeader>
          <CardTitle className="text-sm font-semibold">회원 목록</CardTitle>
        </CardHeader> */}
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">회원번호</TableHead>
                <TableHead className="w-30 text-center">ID</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>등급</TableHead>
                <TableHead>포인트</TableHead>
                <TableHead>가입일</TableHead>
                <TableHead>주문수</TableHead>
                <TableHead>총 구매액</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-center">관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-red-500">
                    오류가 발생했습니다: {error instanceof Error ? error.message : '알 수 없는 오류'}
                  </TableCell>
                </TableRow>
              ) : isLoading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : allMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground">
                    데이터가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                allMembers.map((member, index) => (
                  <TableRow key={member.id}>
                    <TableCell className="text-center">
                      {(page - 1) * limit + index + 1}
                    </TableCell>
                    <TableCell className="text-center">
                      {member.id}
                    </TableCell>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.phoneNumber}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          (member.membership?.name || member.membershipLevel) === 'VIP'
                            ? 'default'
                            : (member.membership?.name || member.membershipLevel) === '골드'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {member.membership?.name || member.membershipLevel}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(member.availablePoints)}</TableCell>
                    <TableCell>
                      {new Date(member.registrationDate).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>{(member as any).orderNumber || 0}</TableCell>
                    <TableCell>{formatCurrency((member as any).totalPurchaseAmount || 0)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.situation === 'Active' ? 'secondary' : 'destructive'
                        }
                      >
                        {member.situation === 'Active' ? '정상' : member.situation}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Dialog
                        open={selectedMemberId === member.id}
                        onOpenChange={(open) =>
                          setSelectedMemberId(open ? member.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            상세 보기
                          </Button>
                        </DialogTrigger>
                        {selectedMember && selectedMember.id === member.id && (
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>회원 상세 정보</DialogTitle>
                              <DialogDescription>
                                회원 정보를 조회하고 등급, 상태, 포인트를 관리할 수 있습니다
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              {/* 기본 정보 */}
                              <div className="space-y-3">
                                <h3 className="font-semibold text-sm">기본 정보</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">회원번호</span>
                                    <p className="font-medium">{Array.isArray(selectedMember.membershipLevel) ? selectedMember.membershipLevel.length : 1}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">ID</span>
                                    <p className="font-medium">{selectedMember.id}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">이름</span>
                                    <p className="font-medium">{selectedMember.name}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">가입일</span>
                                    <p className="font-medium">{new Date(selectedMember.registrationDate).toLocaleDateString('ko-KR')}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">이메일</span>
                                    <p className="font-medium">{selectedMember.email}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">전화번호</span>
                                    <p className="font-medium">{selectedMember.phoneNumber}</p>
                                  </div>
                                </div>
                              </div>

                              {/* 회원 등급 및 상태 */}
                              <div className="space-y-3">
                                <h3 className="font-semibold text-sm">멤버십 등급 및 상태</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label>멤버십 등급</Label>
                                    <Select
                                      value={selectedMembershipLevel}
                                      onValueChange={(value) => {
                                        setSelectedMembershipLevel(value);
                                        // TODO: Implement update membership level
                                        console.log('Update membership level to:', value);
                                      }}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select membership level" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {gradeOptions.map((grade) => (
                                          <SelectItem key={grade} value={grade}>
                                            {grade}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>멤버십 상태</Label>
                                    <Select
                                      value={selectedMembershipStatus}
                                      onValueChange={(value) => setSelectedMembershipStatus(value)}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select membership status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Object.entries(EMembershipStatus).map(([key, value]) => (
                                          <SelectItem key={key} value={value}>
                                            {key === 'ACTIVE' ? '정상' : key === 'INACTIVE' ? '휴면' : '중지'}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>

                              {/* 포인트 관리 */}
                              <div className="space-y-3">
                                <h3 className="font-semibold text-sm">포인트 관리</h3>
                                <div className="flex items-center justify-between bg-gray-200 p-5 rounded-md">
                                  <div>
                                    <span className="text-muted-foreground text-sm block mb-1">현재 보유 포인트</span>
                                    <p className="text-lg font-semibold">{formatCurrency(selectedAvailablePoints)}P</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={handleIncreasePoints}
                                    >
                                      + 지급
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={handleDecreasePoints}
                                      disabled={selectedAvailablePoints <= 0}
                                    >
                                      - 차감
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              {/* 구매 이력 */}
                              <div className="space-y-3">
                                <h3 className="font-semibold text-sm">구매 이력</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">주문 건수</span>
                                    <p className="font-medium">{(selectedMember as any).orderNumber || 0} 건</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">총 구매액</span>
                                    <p className="font-medium">{formatCurrency((selectedMember as any).totalPurchaseAmount || 0)} 원</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                type="button"
                                onClick={handleSave}
                                disabled={updateMembershipMutation.isPending}
                              >
                                {updateMembershipMutation.isPending && (
                                  <Spinner className="mr-2" />
                                )}
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

      {total > 0 && (
        <PaginationButton
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          className="py-4"
        />
      )}
    </div>
  )
}


