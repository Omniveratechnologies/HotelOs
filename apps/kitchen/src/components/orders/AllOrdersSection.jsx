import { useState } from "react";

import API_BASE_URL from "../../config/api.js";

import Pagination from "../ui/Pagination.jsx";
import ModalForm from "../ui/ModalForm.jsx";
import OrdersTable from "./OrdersTable.jsx";

import OrderHeader from "./OrdersHeader.jsx";
import ViewOrderModal from "../ui/ViewOrderModal.jsx";

const AllOrdersSection = ({
  orders = [],
  setOrders,
  searchTerm,
  setSearchTerm,
}) => {
  const ORDERS_API = `${API_BASE_URL}/kitchen/orders`;

  const [filters, setFilters] = useState({
    status: "ALL",
    payment: "ALL",
    date: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);

  const ordersPerPage = 10;

  const orderFields = [
    {
      name: "guestName",
      label: "Guest Name",
      type: "text",
      placeholder: "Enter guest name",
      required: true,
    },
    {
      name: "roomNumber",
      label: "Room Number",
      type: "text",
      placeholder: "Enter room number",
      required: true,
    },
    {
      name: "foodItem",
      label: "Food Item",
      type: "text",
      placeholder: "Enter food item",
      required: true,
    },
    {
      name: "quantity",
      label: "Quantity",
      type: "number",
      placeholder: "Enter quantity",
      required: true,
    },
  ];

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    setCurrentPage(1);
  };

  const filteredOrders = orders.filter((order) => {
    if (filters.status !== "ALL" && order.status !== filters.status) {
      return false;
    }

    if (filters.payment !== "ALL" && order.paymentStatus !== filters.payment) {
      return false;
    }

    if (filters.date) {
      const orderDate = new Date(order.createdAt).toISOString().split("T")[0];

      if (orderDate !== filters.date) {
        return false;
      }
    }

    if (searchTerm?.trim()) {
      const searchValue = searchTerm.toLowerCase();

      const matchesSearch = Object.values(order).some((value) =>
        String(value).toLowerCase().includes(searchValue),
      );

      if (!matchesSearch) {
        return false;
      }
    }

    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const startIndex = (currentPage - 1) * ordersPerPage;

  const paginatedOrders = filteredOrders.slice(
    startIndex,
    startIndex + ordersPerPage,
  );

  const handleEditOrder = (order) => {
    setEditingOrder({
      ...order,
      foodItem: order.items?.[0]?.name || "",
      quantity: order.items?.[0]?.quantity || 1,
    });

    setIsModalOpen(true);
  };

  const handleOrderSubmit = async (data) => {
    if (editingOrder) {
      await handleUpdateOrder(data);
    } else {
      await handleCreateOrder(data);
    }
  };

  const handleCreateOrder = async (data) => {
    try {
      const response = await fetch(ORDERS_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const newOrder = await response.json();

      setOrders((prev) => [newOrder, ...prev]);

      setCurrentPage(1);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  const handleUpdateOrder = async (data) => {
    try {
      const updatedItems = (editingOrder.items || []).map((item, index) => {
        if (index === 0) {
          return {
            foodItemId: item.foodItemId,
            name: data.foodItem,
            price: item.price,
            quantity: Number(data.quantity),
          };
        }

        return {
          foodItemId: item.foodItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        };
      });

      const updateData = {
        guestId: editingOrder.guestId,
        roomId: editingOrder.roomId,
        items: updatedItems,
      };

      console.log("Update payload:", updateData);

      const response = await fetch(`${ORDERS_API}/${editingOrder.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Update failed:", responseData);
        throw new Error(responseData.message || "Failed to update order");
      }

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          String(order.id || order._id) ===
          String(editingOrder.id || editingOrder._id)
            ? {
                ...order,
                ...responseData,
                guestName: data.guestName,
                roomNumber: data.roomNumber,
              }
            : order,
        ),
      );

      setEditingOrder(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleDeleteOrder = async (id) => {
    try {
      const response = await fetch(`${ORDERS_API}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete order");
      }

      setOrders((prev) => prev.filter((order) => order._id !== id));
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  return (
    <>
      <section className="rounded-lg border border-gray-800 bg-[#111111]">
        <div className="flex items-center justify-between border-gray-800 px-4 py-2">
          <h3 className="text-base font-semibold text-white">All Orders</h3>

          <button
            type="button"
            onClick={() => {
              setEditingOrder(null);
              setIsModalOpen(true);
            }}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white transition hover:bg-emerald-800"
          >
            + New Order
          </button>
        </div>

        <OrderHeader
          filters={filters}
          onFilterChange={handleFilterChange}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          orders={filteredOrders}
        />

        <OrdersTable
          orders={paginatedOrders}
          onEdit={handleEditOrder}
          onDelete={handleDeleteOrder}
          onView={(order) => setViewingOrder(order)}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </section>

      <ModalForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOrder(null);
        }}
        title={editingOrder ? "Edit Order" : "Create New Order"}
        subtitle={
          editingOrder ? "Update the order details" : "Enter the order details"
        }
        fields={orderFields}
        initialData={editingOrder || {}}
        submitText={editingOrder ? "Update Order" : "Create Order"}
        onSubmit={handleOrderSubmit}
      />
      <ViewOrderModal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        order={viewingOrder}
      />
    </>
  );
};

export default AllOrdersSection;
