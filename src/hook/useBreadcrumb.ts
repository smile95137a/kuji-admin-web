import { onMounted } from 'vue';
import { useBreadcrumbsStore } from '@/stores';

export const useBreadcrumb = (
  index: number,
  label: string,
  to: string = '/'
) => {
  const breadcrumbs = useBreadcrumbsStore();
  onMounted(() => {
    breadcrumbs.replaceItemAt(index, { label, to });
  });
};
