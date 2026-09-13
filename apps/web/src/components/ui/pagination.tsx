import { Button, ButtonLink } from './button';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages < 2) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:px-5"
    >
      <Button
        variant="ghost"
        className="min-h-9 px-3 text-sm"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <div
        className="flex items-center gap-1"
        aria-label={`Page ${page} of ${totalPages}`}
      >
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (pageNumber) => (
            <ButtonLink
              key={pageNumber}
              href="#learning-list"
              aria-current={pageNumber === page ? 'page' : undefined}
              onClick={(event) => {
                event.preventDefault();
                onPageChange(pageNumber);
              }}
              variant={pageNumber === page ? 'secondary' : 'ghost'}
              className="min-h-9 min-w-9 px-2"
            >
              {pageNumber}
            </ButtonLink>
          ),
        )}
      </div>
      <Button
        variant="ghost"
        className="min-h-9 px-3 text-sm"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
