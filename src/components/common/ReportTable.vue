<!-- src/components/common/ReportTable.vue -->
<template>
  <div
    class="report-table m-t-12"
    :class="{
      'report-table--bordered': bordered,
      'report-table--striped': striped,
      'report-table--fixed-min': widthMode === 'fixed-min',
    }"
  >
    <div
      ref="headRef"
      class="report-table__head"
      v-if="stickyHeader"
      @scroll="handleHeadScroll"
    >
      <table :style="tableInlineStyle">
        <colgroup>
          <col v-if="selectable" :style="colInlineStyle(selectColWidth)" />
          <col
            v-for="col in normalizedColumns"
            :key="`head-col-${col.field}`"
            :style="colInlineStyle(col.width)"
          />
        </colgroup>

        <thead>
          <tr>
            <th
              v-if="selectable"
              :class="[
                'report-table__cell',
                ...selectColWidthClasses,
                fixedSelectColumn ? 'report-table__cell--sticky-left' : '',
              ]"
            >
              <slot name="selection-header" :mode="selectionTypeSafe">
                <template
                  v-if="selectionTypeSafe === 'checkbox' && showSelectAll"
                >
                  <FormCheckbox
                    :model-value="isAllCurrentRowsSelected"
                    :indeterminate="someCurrentRowsSelected"
                    :disabled="enabledCurrentRows.length === 0"
                    @change="toggleSelectAllCurrentRows"
                    aria-label="全選目前頁"
                    size="md"
                  />
                </template>
              </slot>
            </th>

            <th
              v-for="col in normalizedColumns"
              :key="col.field"
              :class="[
                'report-table__cell',
                { 'is-sortable': col.sortable },
                ...columnWidthClasses(col),
              ]"
              @click="col.sortable ? handleSort(col.field) : null"
            >
              <span class="report-table__header-inner">
                <slot :name="`header-${col.field}`" :column="col">
                  {{ col.label }}
                </slot>

                <span
                  v-if="col.sortable"
                  class="report-table__sort-icon"
                  :class="{
                    'is-active': sortKey === col.field,
                    'is-asc': sortKey === col.field && sortOrder === 'asc',
                    'is-desc': sortKey === col.field && sortOrder === 'desc',
                  }"
                >
                  <font-awesome-icon
                    v-if="sortKey === col.field && sortOrder === 'asc'"
                    icon="sort-up"
                  />
                  <font-awesome-icon
                    v-else-if="sortKey === col.field && sortOrder === 'desc'"
                    icon="sort-down"
                  />
                  <font-awesome-icon v-else icon="sort" />
                </span>
              </span>
            </th>
          </tr>
        </thead>
      </table>
    </div>

    <div ref="bodyRef" class="report-table__body" @scroll="handleBodyScroll">
      <table :style="tableInlineStyle">
        <colgroup>
          <col v-if="selectable" :style="colInlineStyle(selectColWidth)" />
          <col
            v-for="col in normalizedColumns"
            :key="`body-col-${col.field}`"
            :style="colInlineStyle(col.width)"
          />
        </colgroup>

        <tbody>
          <tr
            v-for="(item, index) in items"
            :key="rowKeyValue(item)"
            :class="[
              rowClassFn ? rowClassFn(item) : '',
              isRowDisabled(item) ? 'is-disabled' : '',
            ]"
          >
            <td
              v-if="selectable"
              :class="[
                'report-table__cell',
                ...selectColWidthClasses,
                fixedSelectColumn
                  ? 'report-table__cell--sticky-left report-table__cell--sticky-left-body'
                  : '',
              ]"
            >
              <slot
                name="selection-cell"
                :item="item"
                :mode="selectionTypeSafe"
                :disabled="isRowDisabled(item)"
              >
                <template v-if="selectionTypeSafe === 'checkbox'">
                  <FormCheckbox
                    v-if="!item.isPlaceholder"
                    :model-value="selectedSet.has(rowKeyValue(item))"
                    :value="rowKeyValue(item)"
                    :disabled="isRowDisabled(item)"
                    aria-label="選取此列"
                    size="md"
                    @change="
                      (checked: boolean) => toggleRowCheckbox(item, checked)
                    "
                  />
                </template>

                <template v-else-if="selectionTypeSafe === 'radio'">
                  <FormRadio
                    name="report-table-radio"
                    :model-value="selectedId"
                    :value="rowKeyValue(item)"
                    :disabled="isRowDisabled(item)"
                    size="md"
                    @update:model-value="toggleRowRadio"
                  />
                </template>
              </slot>
            </td>

            <td
              v-for="col in normalizedColumns"
              :key="col.field"
              :class="['report-table__cell', ...columnWidthClasses(col)]"
            >
              <div class="report-table__cell-inner">
                <slot
                  :name="`cell-${col.field}`"
                  :item="item"
                  :column="col"
                  :index="index"
                >
                  {{ getCellValue(item, col.field) }}
                </slot>
              </div>
            </td>
          </tr>

          <tr v-if="items.length === 0">
            <td
              :colspan="normalizedColumns.length + (selectable ? 1 : 0)"
              class="report-table__cell text-center"
            >
              <slot name="empty">無資料</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="stickyFooter"
      ref="footerRef"
      class="report-table__footer"
      @scroll="handleFooterScroll"
    >
      <table :style="tableInlineStyle">
        <colgroup>
          <col v-if="selectable" :style="colInlineStyle(selectColWidth)" />
          <col
            v-for="col in normalizedColumns"
            :key="`foot-col-${col.field}`"
            :style="colInlineStyle(col.width)"
          />
        </colgroup>

        <tbody>
          <tr>
            <td
              v-if="selectable"
              :class="[
                'report-table__cell',
                ...selectColWidthClasses,
                fixedSelectColumn ? 'report-table__cell--sticky-left' : '',
              ]"
            >
              <slot name="footer-selection"></slot>
            </td>

            <td
              v-for="col in normalizedColumns"
              :key="col.field"
              :class="['report-table__cell', ...columnWidthClasses(col)]"
            >
              <slot :name="`footer-${col.field}`"></slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { cellWidth } from '@/utils/ReportTableCellWidthClasses';
import FormCheckbox from '@/components/common/FormCheckbox.vue';
import FormRadio from '@/components/common/FormRadio.vue';

type WidthSpec =
  | number
  | {
      base?: number;
      md?: number;
      lg?: number;
    };

type Column = {
  field: string;
  label: string;
  width?: WidthSpec;
  sortable?: boolean;
};

type SelectionType = 'checkbox' | 'radio' | 'custom';
type WidthMode = 'fit' | 'fixed-min';

const props = withDefaults(
  defineProps<{
    columns: Column[];
    items: any[];
    rowKey: string;

    selectable?: boolean;
    selectionType?: SelectionType;
    showSelectAll?: boolean;

    selected?: string[];
    selectedId?: string | null;

    sortKey?: string;
    sortOrder?: 'asc' | 'desc' | '';

    useWidthClass?: boolean;
    selectColWidth?: WidthSpec;
    rowClassFn?: (item: any) => string | string[] | undefined;
    rowDisabled?: (item: any) => boolean;

    stickyHeader?: boolean;
    stickyFooter?: boolean;
    fixedSelectColumn?: boolean;
    bordered?: boolean;
    striped?: boolean;
    widthMode?: WidthMode;
  }>(),
  {
    items: () => [],
    selectable: false,
    selectionType: 'checkbox',
    showSelectAll: true,

    selected: () => [],
    selectedId: null,

    sortKey: '',
    sortOrder: 'asc',

    useWidthClass: true,
    selectColWidth: 40,
    rowClassFn: undefined,
    rowDisabled: undefined,

    stickyHeader: true,
    stickyFooter: false,
    fixedSelectColumn: false,
    bordered: true,
    striped: true,
    widthMode: 'fit',
  },
);

const emit = defineEmits<{
  (e: 'update:selected', value: string[]): void;
  (e: 'update:selectedId', value: string | null): void;
  (e: 'update:sortKey', value: string): void;
  (e: 'update:sortOrder', value: 'asc' | 'desc'): void;
  (e: 'sort', payload: { key: string; order: 'asc' | 'desc' }): void;
}>();

const headRef = ref<HTMLElement | null>(null);
const bodyRef = ref<HTMLElement | null>(null);
const footerRef = ref<HTMLElement | null>(null);
const syncingScroll = ref(false);

const syncScrollLeft = (source: 'head' | 'body' | 'footer', left: number) => {
  if (syncingScroll.value) return;
  syncingScroll.value = true;

  if (source !== 'head' && headRef.value) headRef.value.scrollLeft = left;
  if (source !== 'body' && bodyRef.value) bodyRef.value.scrollLeft = left;
  if (source !== 'footer' && footerRef.value) footerRef.value.scrollLeft = left;

  requestAnimationFrame(() => {
    syncingScroll.value = false;
  });
};

const handleHeadScroll = () => {
  if (!headRef.value) return;
  syncScrollLeft('head', headRef.value.scrollLeft);
};

const handleBodyScroll = () => {
  if (!bodyRef.value) return;
  syncScrollLeft('body', bodyRef.value.scrollLeft);
};

const handleFooterScroll = () => {
  if (!footerRef.value) return;
  syncScrollLeft('footer', footerRef.value.scrollLeft);
};

const normalizedColumns = computed<Column[]>(() =>
  (props.columns || [])
    .filter((c) => !!c && !!c.field)
    .map((c) => ({
      ...c,
      sortable: c.sortable === true,
    })),
);

const rowKeyValue = (item: any) => String(item?.[props.rowKey] ?? '');

const isRowDisabled = (item: any) => {
  return props.rowDisabled?.(item) === true;
};

const enabledCurrentRows = computed(() => {
  return (props.items || []).filter(
    (item) => !item?.isPlaceholder && !isRowDisabled(item),
  );
});

const enabledCurrentIds = computed(() => {
  return enabledCurrentRows.value.map((item) => rowKeyValue(item));
});

const selectionTypeSafe = computed<SelectionType>(() => {
  const t = props.selectionType ?? 'checkbox';
  return t === 'checkbox' || t === 'radio' || t === 'custom' ? t : 'checkbox';
});

const selectedSet = computed(() => new Set(props.selected || []));

const isAllCurrentRowsSelected = computed(() => {
  if (
    !props.selectable ||
    selectionTypeSafe.value !== 'checkbox' ||
    !props.showSelectAll ||
    enabledCurrentIds.value.length === 0
  ) {
    return false;
  }

  return enabledCurrentIds.value.every((id) => selectedSet.value.has(id));
});

const someCurrentRowsSelected = computed(() => {
  if (
    !props.selectable ||
    selectionTypeSafe.value !== 'checkbox' ||
    !props.showSelectAll ||
    enabledCurrentIds.value.length === 0
  ) {
    return false;
  }

  const hit = enabledCurrentIds.value.filter((id) =>
    selectedSet.value.has(id),
  ).length;

  return hit > 0 && hit < enabledCurrentIds.value.length;
});

const toggleSelectAllCurrentRows = () => {
  if (
    !props.selectable ||
    selectionTypeSafe.value !== 'checkbox' ||
    !props.showSelectAll
  ) {
    return;
  }

  const currentIds = enabledCurrentIds.value;

  if (currentIds.length === 0) return;

  if (isAllCurrentRowsSelected.value) {
    const next = (props.selected || []).filter(
      (id) => !currentIds.includes(id),
    );
    emit('update:selected', next);
  } else {
    const next = Array.from(
      new Set([...(props.selected || []), ...currentIds]),
    );
    emit('update:selected', next);
  }
};

const toggleRowCheckbox = (item: any, checked: boolean) => {
  if (!props.selectable || selectionTypeSafe.value !== 'checkbox') return;
  if (isRowDisabled(item)) return;

  const id = rowKeyValue(item);
  const current = props.selected || [];

  if (checked) {
    emit('update:selected', Array.from(new Set([...current, id])));
    return;
  }

  emit(
    'update:selected',
    current.filter((x) => x !== id),
  );
};

const toggleRowRadio = (id: string) => {
  if (!props.selectable || selectionTypeSafe.value !== 'radio') return;

  const item = (props.items || []).find((row) => rowKeyValue(row) === id);
  if (item && isRowDisabled(item)) return;

  emit('update:selectedId', id);
};

const getCellValue = (item: any, field: string) => item?.[field] ?? '';

const toWidthClasses = (w?: WidthSpec): string[] => {
  if (!props.useWidthClass || !w) return [];
  if (typeof w === 'number') return cellWidth(w);

  const base = typeof w.base === 'number' ? w.base : undefined;
  const md = typeof w.md === 'number' ? w.md : undefined;
  const lg = typeof w.lg === 'number' ? w.lg : undefined;

  return cellWidth(base as number, md as number, lg as number);
};

const widthToPx = (w?: WidthSpec): string | undefined => {
  if (!w) return undefined;
  if (typeof w === 'number') return `${w}px`;
  if (typeof w.base === 'number') return `${w.base}px`;
  return undefined;
};

const colInlineStyle = (w?: WidthSpec) => {
  const px = widthToPx(w);
  if (!px) return {};
  return {
    width: px,
    minWidth: px,
    maxWidth: px,
  };
};

const DEFAULT_COL_WIDTH = 120;

const getWidthNumber = (w?: WidthSpec): number => {
  if (!w) return DEFAULT_COL_WIDTH;
  if (typeof w === 'number') return w;
  if (typeof w.base === 'number') return w.base;
  return DEFAULT_COL_WIDTH;
};

const totalTableWidth = computed(() => {
  const selectWidth = props.selectable
    ? getWidthNumber(props.selectColWidth)
    : 0;

  const columnsWidth = normalizedColumns.value.reduce((sum, col) => {
    return sum + getWidthNumber(col.width);
  }, 0);

  return selectWidth + columnsWidth;
});

const tableInlineStyle = computed(() => {
  if (props.widthMode !== 'fixed-min') return {};

  return {
    width: `${totalTableWidth.value}px`,
    minWidth: '100%',
  };
});

const selectColWidthClasses = computed(() =>
  toWidthClasses(props.selectColWidth),
);

const columnWidthClasses = (col: Column): string[] => toWidthClasses(col.width);

const handleSort = (field: string) => {
  const nextKey = field;
  const nextOrder: 'asc' | 'desc' =
    props.sortKey === field
      ? props.sortOrder === 'asc'
        ? 'desc'
        : 'asc'
      : 'asc';

  emit('update:sortKey', nextKey);
  emit('update:sortOrder', nextOrder);
  emit('sort', { key: nextKey, order: nextOrder });
};
</script>
