import { defineStore } from 'pinia';
import { ref } from 'vue';

interface BreadcrumbItem {
  label: string;
  to: string;
}

export const useBreadcrumbsStore = defineStore('breadcrumbs', () => {
  const items = ref<BreadcrumbItem[]>([{ label: '首頁', to: '/' }]);

  const setItems = (newItems: BreadcrumbItem[]) => {
    items.value = newItems;
  };

  const pushItem = (item: BreadcrumbItem) => {
    items.value.push(item);
  };

  const removeAfter = (index: number) => {
    if (index >= 0 && index < items.value.length) {
      items.value = items.value.slice(0, index + 1);
    }
  };

  const replaceItemAt = (index: number, newItem: BreadcrumbItem) => {
    if (index >= 0 && index < items.value.length) {
      items.value[index] = newItem;
    } else if (index === items.value.length) {
      items.value.push(newItem);
    } else if (index > items.value.length) {
      const filler: BreadcrumbItem = { label: '', to: '' };
      while (items.value.length < index) {
        items.value.push(filler);
      }
      items.value.push(newItem);
    }
  };

  return { items, setItems, pushItem, removeAfter, replaceItemAt };
});
