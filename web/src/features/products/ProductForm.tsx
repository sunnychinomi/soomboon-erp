import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { vendorsApi } from '@/api/vendors.api';
import type { ProductDetail, ProductInput } from '@/api/types';

const schema = z.object({
  code: z.string().min(1, 'ระบุรหัสสินค้า').max(50),
  name: z.string().min(1, 'ระบุชื่อสินค้า').max(200),
  nameEn: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  partNumberOem: z.string().optional().nullable(),
  partNumberVendor: z.string().optional().nullable(),
  carBrand: z.string().optional().nullable(),
  carModel: z.string().optional().nullable(),
  type: z.enum(['Genuine', 'Aftermarket']),
  unit: z.string().min(1, 'ระบุหน่วยนับ'),
  cost: z.coerce.number().min(0, 'ต้นทุนต้องไม่ติดลบ'),
  price: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ'),
  reorderLevel: z.coerce.number().int().min(0, 'จำนวนต้องไม่ติดลบ'),
  primaryVendorId: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProductInput) => Promise<unknown>;
  initialData?: ProductDetail | null;
  loading?: boolean;
}

export function ProductForm({ open, onClose, onSubmit, initialData, loading }: ProductFormProps) {
  const isEdit = !!initialData;

  const { data: vendors } = useQuery({
    queryKey: ['vendors-all'],
    queryFn: () => vendorsApi.list({ pageSize: 200 }),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: initialData ? {
      code: initialData.code,
      name: initialData.name,
      nameEn: initialData.nameEn,
      category: initialData.category,
      brand: initialData.brand,
      partNumberOem: initialData.partNumberOem,
      partNumberVendor: initialData.partNumberVendor,
      carBrand: initialData.carBrand,
      carModel: initialData.carModel,
      type: initialData.type,
      unit: initialData.unit,
      cost: initialData.cost,
      price: initialData.price,
      reorderLevel: initialData.reorderLevel,
      primaryVendorId: initialData.primaryVendorId,
    } : {
      code: '',
      name: '',
      type: 'Aftermarket',
      unit: 'ชิ้น',
      cost: 0,
      price: 0,
      reorderLevel: 5,
    } as FormData,
  });

  const submit = handleSubmit(async (data) => {
    const payload: ProductInput = {
      ...data,
      primaryVendorId: data.primaryVendorId || null,
    };
    if (isEdit) delete (payload as any).code;
    await onSubmit(payload);
    reset();
    onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
      description={isEdit ? `${initialData?.code} · ${initialData?.name}` : undefined}
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button variant="primary" onClick={submit} disabled={loading}>
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="grid grid-cols-2 gap-5">
        <Field label="รหัสสินค้า">
          <Input {...register('code')} placeholder="AP-XXXX" disabled={isEdit} />
          {errors.code && <span className="text-xs text-rust mt-1">{errors.code.message}</span>}
        </Field>
        <Field label="ประเภท">
          <select {...register('type')} className="w-full px-3 py-2.5 border border-rule-strong rounded-lg bg-white text-sm focus:outline-none focus:border-ink">
            <option value="Aftermarket">เทียม (Aftermarket)</option>
            <option value="Genuine">แท้ (Genuine)</option>
          </select>
        </Field>

        <Field label="ชื่อสินค้า (ไทย)" className="col-span-2">
          <Input {...register('name')} placeholder="ชื่อสินค้า" />
          {errors.name && <span className="text-xs text-rust mt-1">{errors.name.message}</span>}
        </Field>

        <Field label="ชื่อสินค้า (อังกฤษ)" className="col-span-2">
          <Input {...register('nameEn')} placeholder="Product name in English" />
        </Field>

        <Field label="ยี่ห้อสินค้า"><Input {...register('brand')} placeholder="Toyota, KYB..." /></Field>
        <Field label="หมวดหมู่"><Input {...register('category')} placeholder="เครื่องยนต์, ระบบเบรก..." /></Field>

        <Field label="Part Number (แท้)"><Input {...register('partNumberOem')} /></Field>
        <Field label="Part Number (ผู้ขาย)"><Input {...register('partNumberVendor')} /></Field>

        <Field label="ยี่ห้อรถ"><Input {...register('carBrand')} placeholder="Toyota, Honda..." /></Field>
        <Field label="รุ่นรถ"><Input {...register('carModel')} placeholder="Vios 2008, Civic FB..." /></Field>

        <Field label="หน่วยนับ"><Input {...register('unit')} placeholder="ชิ้น, ลูก, เส้น..." /></Field>
        <Field label="จุดสั่งซื้อ"><Input type="number" {...register('reorderLevel')} /></Field>

        <Field label="ต้นทุน (฿)">
          <Input type="number" step="0.01" {...register('cost')} />
          {errors.cost && <span className="text-xs text-rust mt-1">{errors.cost.message}</span>}
        </Field>
        <Field label="ราคาขาย (฿)">
          <Input type="number" step="0.01" {...register('price')} />
          {errors.price && <span className="text-xs text-rust mt-1">{errors.price.message}</span>}
        </Field>

        <Field label="ผู้ขายหลัก" className="col-span-2">
          <select {...register('primaryVendorId')} className="w-full px-3 py-2.5 border border-rule-strong rounded-lg bg-white text-sm focus:outline-none focus:border-ink">
            <option value="">— ไม่ระบุ —</option>
            {vendors?.items.map((v) => (
              <option key={v.id} value={v.id}>{v.code} · {v.name}</option>
            ))}
          </select>
        </Field>
      </form>
    </Modal>
  );
}
