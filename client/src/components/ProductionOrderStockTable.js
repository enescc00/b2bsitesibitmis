import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { IoIosCloseCircle } from "react-icons/io";

export const ProductionOrderStockTable = ({
  tree,
  inventoryItems,
  quantity,
}) => (
  <div className="table-responsive">
    <table className="table">
      <thead>
        <tr>
          <th scope="col">AD</th>
          <th scope="col">Gereken Miktar</th>
          <th scope="col">Miktar</th>
          <th scope="col">Mevcut Stok</th>
          <th scope="col">Durum</th>
        </tr>
      </thead>
      <tbody>
        {tree?.product?.isManufactured ? (
          inventoryItems.map((item) => {
            const component = tree.components.find(
              (c) => c.inventoryItem._id === item._id
            );
            const needed = component.quantity * quantity;
            return (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{needed}</td>
                <td>{component.quantity}</td>
                <td>{item.quantity}</td>
                <td>
                  {needed <= item.quantity ? (
                    <span>
                      <IoCheckmarkDoneCircleSharp color="green" size={20} />{" "}
                      Yeterli
                    </span>
                  ) : (
                    <span>
                      <IoIosCloseCircle color="red" size={20} /> Yetersiz
                    </span>
                  )}
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={5}>
              <p>Henüz geçerli bir ürün seçimi yapmadınız.</p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);
