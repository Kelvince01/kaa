import { parseAsArrayOf, parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useUserParams(options?: { shallow: boolean }) {
	const [params, setParams] = useQueryStates(
		{
			userId: parseAsString,
			createUser: parseAsBoolean,
			sort: parseAsArrayOf(parseAsString),
			name: parseAsString,
			q: parseAsString,
		},
		options
	);

	return {
		...params,
		setParams,
	};
}
