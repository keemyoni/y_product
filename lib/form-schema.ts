import { z } from "zod";

export const searchFormSchema = z.object({
  keyword: z.string().trim().max(80, "검색어는 80자 이하로 입력해주세요.")
});

export type SearchFormValues = z.infer<typeof searchFormSchema>;
