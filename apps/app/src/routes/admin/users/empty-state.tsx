import { Button } from "@kaa/ui/components/button";
import { useUserParams } from "@/hooks/use-user-params";

export function EmptyState() {
  const { setParams } = useUserParams();

  return (
    <div className="flex items-center justify-center">
      <div className="mt-40 flex flex-col items-center">
        <div className="mb-6 space-y-2 text-center">
          <h2 className="font-medium text-lg">No users</h2>
          <p className="text-[#606060] text-sm">
            You haven't created any users yet. <br />
            Go ahead and create your first one.
          </p>
        </div>

        <Button
          onClick={() =>
            setParams({
              createUser: true,
            })
          }
          variant="outline"
        >
          Create user
        </Button>
      </div>
    </div>
  );
}

export function NoResults() {
  const { setParams } = useUserParams();

  return (
    <div className="flex items-center justify-center">
      <div className="mt-40 flex flex-col items-center">
        <div className="mb-6 space-y-2 text-center">
          <h2 className="font-medium text-lg">No results</h2>
          <p className="text-[#606060] text-sm">
            Try another search, or adjusting the filters
          </p>
        </div>

        <Button
          onClick={() => setParams(null, { shallow: false })}
          variant="outline"
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}
