'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { redirect } from 'next/navigation'

// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
// import {
//   ChartContainer,
//   ChartTooltip,
//   ChartTooltipContent,
// } from '@/components/ui/chart'
// import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
// import {
//   dashboardStats,
//   recentDailySales,
//   recentOrders,
// } from '@/lib/admin/mock-dashboard'
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '@/components/ui/table'
// importredirect,  { usePathname } from 'next/navigation'

// const chartConfig = {
//   amount: {
//     label: '매출',
//     color: 'hsl(var(--primary))',
//   },
// }

// const adminSections = [
//   {
//     href: '/admin/permissions',
//     title: 'Admin User Management',
//     description: '관리자 계정과 권한을 관리합니다.',
//   },
//   {
//     href: '/admin/members',
//     title: 'User Management',
//     description: '회원 정보, 등급, 주문 이력을 한눈에 확인합니다.',
//   },
//   {
//     href: '/admin/products',
//     title: 'Product Management',
//     description: '상품 노출, 가격, 재고를 관리합니다.',
//   },
//   {
//     href: '/admin/products/new',
//     title: 'Product Upload',
//     description: '신규 상품을 등록하고 상세 정보를 설정합니다.',
//   },
//   {
//     href: '/admin/orders',
//     title: 'Order Management',
//     description: '주문 상태를 확인하고 배송을 처리합니다.',
//   },
//   {
//     href: '/admin/community',
//     title: 'Community Management',
//     description: '레시피, 리뷰 등 커뮤니티 콘텐츠를 관리합니다.',
//   },
//   {
//     href: '/admin/coupons',
//     title: 'Coupon Management',
//     description: '쿠폰 발급 및 사용 내역을 관리합니다.',
//   },
//   {
//     href: '/admin/banner-management',
//     title: 'Banner Management',
//     description: '메인 배너와 프로모션 노출을 설정합니다.',
//   },
// ] as const

// export default function AdminDashboardPage() {
//   const pathname = usePathname();
//   // Check if we're on /admin/community/[id] route (exclude from dashboard)
//   const isRecipeDetailPage = /^\/admin\/community\/[^/]+$/.test(pathname);
//   return (
//     <div className="space-y-10">
//       {/* Hero / Figma-style admin dashboard card */}
//       <section className="space-y-6">
//         <div className="space-y-2">
//           {/* <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
//             Liflow · Juwang Mall
//           </p> */}
//           <h1 className="text-2xl font-semibold tracking-tight">
//             대시보드
//           </h1>
//           <p className="text-muted-foreground max-w-xl text-sm">
//             쭈왕몰 관리 현황
//           </p>
//         </div>

//         {/* <Card className="border-border/60 bg-linear-to-br from-slate-900 via-slate-900 to-slate-800 text-slate-50 shadow-xl">
//           <CardHeader className="pb-4">
//             <CardTitle className="text-2xl font-semibold">
//               Admin Control Center
//             </CardTitle>
//             <CardDescription className="text-slate-300">
//               Quickly move to the management page you need. This block mirrors
//               the Admin Dashboard design in Figma.
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="grid gap-2 md:grid-cols-2">
//             {!isRecipeDetailPage && adminSections.map((section) => (
//               <Link
//                 key={section.href}
//                 href={section.href}
//                 className="hover:border-slate-100/60 hover:bg-slate-900/40 group flex items-center justify-between rounded-lg border border-slate-700/60 bg-slate-900/30 px-4 py-3 text-sm transition-colors"
//               >
//                 <div className="space-y-0.5">
//                   <p className="font-medium">{section.title}</p>
//                   <p className="text-slate-300 text-xs">
//                     {section.description}
//                   </p>
//                 </div>
//                 <ArrowRight className="text-slate-200 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
//               </Link>
//             ))}
//           </CardContent>
//         </Card> */}
//       </section>

//       {/* Today stats overview */}
//       <section className="space-y-3">
//         <div>
//           {/* <h2 className="text-xl font-semibold">오늘 매출 · 회원 현황</h2>
//           <p className="text-muted-foreground text-sm">
//             하루 매출과 신규 가입, 주문 진행 상황을 요약해서 보여줍니다.
//           </p> */}
//         </div>

//         <div className="grid gap-4 md:grid-cols-3">
//           {dashboardStats.map((item) => (
//             <Card key={item.label}>
//               <CardHeader>
//                 <CardTitle className="text-sm font-medium">
//                   {item.label}
//                 </CardTitle>
//                 <CardDescription className="text-xs">
//                   {item.helper}
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="flex items-center justify-between">
//                 <p className="text-2xl font-semibold">{item.value}</p>
//                 <Badge
//                   variant={item.trend === 'up' ? 'secondary' : 'destructive'}
//                   className="text-[11px]"
//                 >
//                   {item.trend === 'up' ? '상승' : '하락'}
//                 </Badge>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </section>

//       {/* Sales chart */}
//       <section className="space-y-3">
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-sm font-semibold">
//               최근 7일 매출
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="border-muted rounded-lg border px-4 py-6">
//               <ChartContainer config={chartConfig} className="h-64">
//                 <BarChart data={recentDailySales}>
//                   <CartesianGrid vertical={false} strokeDasharray="3 3" />
//                   <XAxis
//                     dataKey="date"
//                     tickLine={false}
//                     axisLine={false}
//                     tickMargin={8}
//                   />
//                   <YAxis
//                     tickLine={false}
//                     axisLine={false}
//                     tickMargin={8}
//                     tickFormatter={(v) => `${v / 10000}만`}
//                   />
//                   <ChartTooltip
//                     cursor={{ fill: 'hsl(var(--muted))' }}
//                     content={<ChartTooltipContent />}
//                   />
//                   <Bar
//                     dataKey="amount"
//                     fill="var(--color-amount)"
//                     radius={[4, 4, 0, 0]}
//                   />
//                 </BarChart>
//               </ChartContainer>
//             </div>
//           </CardContent>
//         </Card>
//       </section>

//       {/* Recent orders */}
//       <section className="space-y-3">
//         <Card>
//           <CardHeader>
//             <CardTitle className="text-sm font-semibold">최근 주문</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>주문번호</TableHead>
//                   <TableHead>주문자</TableHead>
//                   <TableHead>상품명</TableHead>
//                   <TableHead>금액</TableHead>
//                   <TableHead>상태</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {recentOrders.map((order) => (
//                   <TableRow key={order.id}>
//                     <TableCell>{order.id}</TableCell>
//                     <TableCell>{order.customer}</TableCell>
//                     <TableCell>{order.product}</TableCell>
//                     <TableCell>{order.amount}원</TableCell>
//                     <TableCell>
//                       <Badge
//                         variant={
//                           order.status === '배송중'
//                             ? 'secondary'
//                             : order.status === '배송준비'
//                               ? 'outline'
//                               : 'default'
//                         }
//                       >
//                         {order.status}
//                       </Badge>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </CardContent>
//         </Card>
//       </section>
//     </div>
//   )
// }

export default function AdminPage() {
  redirect('/admin/members')
}