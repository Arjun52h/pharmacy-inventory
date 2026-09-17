const outbox = [];

const createReorderAlert = ({
  medicineName,
  currentStock,
  threshold,
}) => {
  const notification = {
    id: Date.now().toString(),
    type: "REORDER_ALERT",
    medicineName,
    currentStock,
    threshold,
    createdAt: new Date().toISOString(),
  };

  outbox.push(notification);

  return notification;
};

const getOutbox = () => {
  return outbox;
};

module.exports = {
  createReorderAlert,
  getOutbox,
};