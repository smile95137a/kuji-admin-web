<template>
  <div
    class="report-table m-t-12"
    :class="{
      'report-table--bordered': bordered,
      'report-table--striped': striped,
    }"
  >
    <!-- 表頭（可固定） -->
    <div class="report-table__head" v-if="stickyHeader">
      <table>
        <thead>
          <tr>
            <!-- 選擇欄（可固定在左） -->
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

                <!-- 預設排序圖示（未排序時也顯示） -->
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

    <!-- 表身（可固定左側選取欄） -->
    <div class="report-table__body">
      <table>
        <tbody>
          <tr
            v-for="(item, index) in items"
            :key="rowKeyValue(item)"
            :class="[rowClassFn ? rowClassFn(item) : '']"
          >
            <!-- 選擇欄 -->
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
              >
                <!-- selection-cell slot 內 -->
                <template v-if="selectionTypeSafe === 'checkbox'">
                  <FormCheckbox
                    v-if="!item.isPlaceholder"
                    v-model="computedSelected"
                    :value="rowKeyValue(item)"
                    aria-label="選取此列"
                    size="md"
                  />
                </template>

                <template v-else-if="selectionTypeSafe === 'radio'">
                  <FormRadio
                    name="report-table-radio"
                    :model-value="selectedId"
                    :value="rowKeyValue(item)"
                    size="md"
                    @update:model-value="toggleRowRadio"
                  />
                </template>
              </slot>
            </td>

            <!-- 一般欄位 -->
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

    <!-- 表尾（可固定） -->
    <div v-if="stickyFooter" class="report-table__footer">
      <table>
        <tbody>
          <tr>
            <!-- 選擇欄（表尾也對齊寬度 & 可固定左） -->
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

            <!-- 逐欄的表尾（提供 slot 自訂，如：小計/合計） -->
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
import { computed, withDefaults, defineProps, defineEmits } from 'vue';
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
const computedSelected = computed<string[]>({
  get: () => props.selected || [],
  set: (val) => emit('update:selected', val),
});
const someCurrentRowsSelected = computed(() => {
  if (
    !props.selectable ||
    selectionTypeSafe.value !== 'checkbox' ||
    !props.showSelectAll ||
    props.items.length === 0
  )
    return false;

  const currentIds = props.items.map((it) => rowKeyValue(it));
  const set = selectedSet.value;
  const hit = currentIds.filter((id) => set.has(id)).length;
  return hit > 0 && hit < currentIds.length;
});

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

    stickyHeader?: boolean;
    stickyFooter?: boolean;
    fixedSelectColumn?: boolean;
    bordered?: boolean;
    striped?: boolean;
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

    stickyHeader: true,
    stickyFooter: false,
    fixedSelectColumn: false,
    bordered: true,
    striped: true,
  }
);

const emit = defineEmits<{
  (e: 'update:selected', value: string[]): void;
  (e: 'update:selectedId', value: string | null): void;
  (e: 'update:sortKey', value: string): void;
  (e: 'update:sortOrder', value: 'asc' | 'desc'): void;
  (e: 'sort', payload: { key: string; order: 'asc' | 'desc' }): void;
}>();

const normalizedColumns = computed<Column[]>(() =>
  (props.columns || [])
    .filter((c) => !!c && !!c.field)
    .map((c) => ({
      ...c,
      sortable: c.sortable === true,
    }))
);

const rowKeyValue = (item: any) => String(item?.[props.rowKey] ?? '');

const selectionTypeSafe = computed<SelectionType>(() => {
  const t = props.selectionType ?? 'checkbox';
  return t === 'checkbox' || t === 'radio' || t === 'custom' ? t : 'checkbox';
});

const selectedSet = computed(() => new Set(props.selected));

const isAllCurrentRowsSelected = computed(() => {
  if (
    !props.selectable ||
    selectionTypeSafe.value !== 'checkbox' ||
    !props.showSelectAll ||
    props.items.length === 0
  ) {
    return false;
  }
  return props.items.every((it) => selectedSet.value.has(rowKeyValue(it)));
});

const toggleSelectAllCurrentRows = () => {
  if (
    !props.selectable ||
    selectionTypeSafe.value !== 'checkbox' ||
    !props.showSelectAll
  )
    return;

  const currentIds = props.items.map((it) => rowKeyValue(it));
  if (isAllCurrentRowsSelected.value) {
    const next = (props.selected || []).filter(
      (id) => !currentIds.includes(id)
    );
    emit('update:selected', next);
  } else {
    const next = Array.from(
      new Set([...(props.selected || []), ...currentIds])
    );
    emit('update:selected', next);
  }
};

const toggleRowRadio = (id: string) => {
  if (!props.selectable || selectionTypeSafe.value !== 'radio') return;
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

const selectColWidthClasses = computed(() =>
  toWidthClasses(props.selectColWidth)
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
