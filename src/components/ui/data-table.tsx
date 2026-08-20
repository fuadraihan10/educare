"use client"

import { useState } from "react"
import {
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type { LucideIcon } from "lucide-react"
import { Search } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: LucideIcon
}

function DataTable<TData>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  emptyTitle = "No results",
  emptyDescription = "There are no items to display.",
  emptyIcon,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  })

  const pageCount = table.getPageCount()
  const currentPage = pagination.pageIndex

  function getPageNumbers(): (number | "...")[] {
    if (pageCount <= 5) {
      return Array.from({ length: pageCount }, (_, i) => i)
    }

    const pages: (number | "...")[] = [0]

    if (currentPage > 2) {
      pages.push("...")
    }

    const start = Math.max(1, currentPage - 1)
    const end = Math.min(pageCount - 2, currentPage + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (currentPage < pageCount - 3) {
      pages.push("...")
    }

    if (pageCount > 1) {
      pages.push(pageCount - 1)
    }

    return pages
  }

  return (
    <div className="space-y-4">
      {searchKey && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder ?? "Search..."}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(e) =>
              table.getColumn(searchKey)?.setFilterValue(e.target.value)
            }
            className="pl-9"
          />
        </div>
      )}

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <EmptyState
                  icon={emptyIcon}
                  title={emptyTitle}
                  description={emptyDescription}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {table.getRowModel().rows?.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {pagination.pageIndex * pagination.pageSize + 1} to{" "}
            {Math.min(
              (pagination.pageIndex + 1) * pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} results
          </p>

          {pageCount > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => table.previousPage()}
                    aria-disabled={currentPage === 0}
                    className={currentPage === 0 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => table.setPageIndex(page)}
                      >
                        {page + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => table.nextPage()}
                    aria-disabled={currentPage >= pageCount - 1}
                    className={
                      currentPage >= pageCount - 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  )
}

export { DataTable }
