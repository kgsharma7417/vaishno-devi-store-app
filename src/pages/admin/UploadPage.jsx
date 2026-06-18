import { useSearchParams } from "react-router-dom";
import ProductForm from "../../components/admin/ProductForm";

export default function UploadPage() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  
  return <ProductForm editId={editId} />;
}
