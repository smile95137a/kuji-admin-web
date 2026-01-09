import * as yup from 'yup';

export const buildRoleSchema = (isDetail: boolean) => {
  if (isDetail) {
    return yup.object({
      name: yup.string().nullable(),
      code: yup.string().nullable(),
      description: yup.string().nullable(),
    });
  }

  return yup.object({
    name: yup.string().required('角色名稱不可為空').max(50, '角色名稱最多50字'),
    code: yup.string().required('角色代碼不可為空').max(50, '角色代碼最多50字'),
    description: yup.string().nullable().max(200, '角色描述最多200字'),
  });
};
