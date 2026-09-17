import { useEffect, useMemo, useState } from "react";
import {
  getBatches,
  createBatch,
  dispenseMedicine,
  getExpiringBatches,
  getMedicineStock,
} from "./services/api";

function App() {
  const [batches, setBatches] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [medicineStock, setMedicineStock] = useState([]);

  const [showAdd, setShowAdd] = useState(false);
  const [showDispense, setShowDispense] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [dispenseResult, setDispenseResult] = useState(null);

  const [batchForm, setBatchForm] = useState({
    medicineName: "",
    batchNumber: "",
    expiryDate: "",
    quantity: "",
  });

  const [dispenseForm, setDispenseForm] = useState({
    medicineName: "",
    quantity: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);

      const [batchResponse, expiryResponse, stockResponse] =
        await Promise.all([
          getBatches(search),
          getExpiringBatches(30),
          getMedicineStock(),
        ]);

      setBatches(batchResponse.data.data);
      setExpiring(expiryResponse.data.data);
      setMedicineStock(stockResponse.data.data);

      setBatches(batchResponse.data.data);
      setExpiring(expiryResponse.data.data);

      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load pharmacy data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

const sellableStock = useMemo(() => {
  return medicineStock.reduce(
    (total, medicine) => total + medicine.sellableStock,
    0
  );
}, [medicineStock]);

  const medicineCount = new Set(
    batches.map((batch) => batch.medicineName.toLowerCase())
  ).size;

  const submitBatch = async (e) => {
    e.preventDefault();

    try {
      await createBatch({
        ...batchForm,
        quantity: Number(batchForm.quantity),
      });

      setBatchForm({
        medicineName: "",
        batchNumber: "",
        expiryDate: "",
        quantity: "",
      });

      setShowAdd(false);
      setMessage("Batch added successfully");
      setError("");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to add batch"
      );
    }
  };

  const submitDispense = async (e) => {
  e.preventDefault();

  try {
    const response = await dispenseMedicine({
      medicineName: dispenseForm.medicineName.trim(),
      quantity: Number(dispenseForm.quantity),
    });

    setMessage(
      `Dispensed ${response.data.dispensed} units successfully using FEFO`
    );

    setDispenseResult(response.data);

    setDispenseForm({
      medicineName: "",
      quantity: "",
    });

    setShowDispense(false);
    setError("");

    await loadData();
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Failed to dispense medicine"
    );
  }
};

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

 const getStatus = (expiryDate, quantity) => {
  if (quantity === 0) return "out-of-stock";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) return "expired";

  const difference =
    (expiry - today) / (1000 * 60 * 60 * 24);

  if (difference <= 30) return "expiring";

  return "in-date";
};

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>PharmaStock</h1>
          <p>FEFO-based pharmacy inventory management</p>
        </div>

        <div className="header-actions">
          <button
            className="secondary-btn"
            onClick={() => setShowDispense(true)}
          >
            Dispense
          </button>

          <button
            className="primary-btn"
            onClick={() => setShowAdd(true)}
          >
            + Add Batch
          </button>
        </div>
      </header>

      <main className="container">
        {message && (
          <div className="success-message">
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError("")}>×</button>
          </div>
        )}


        {dispenseResult && (
  <div className="dispense-result">
    <div className="dispense-result-header">
      <div>
        <strong>FEFO Allocation</strong>
        <span>
          {dispenseResult.medicineName} ·{" "}
          {dispenseResult.dispensed} units dispensed
        </span>
      </div>

      <button onClick={() => setDispenseResult(null)}>
        ×
      </button>
    </div>

    <div className="allocation-list">
      {dispenseResult.dispensedFrom.map((item) => (
        <div
          className="allocation-item"
          key={item.batchNumber}
        >
          <div>
            <strong>{item.batchNumber}</strong>
            <span>
              Expires {formatDate(item.expiryDate)}
            </span>
          </div>

          <strong>{item.quantity} units</strong>
        </div>
      ))}
    </div>
  </div>
)}

        <section className="stats">
          <div className="stat-card">
            <span>Total Medicines</span>
            <strong>{medicineCount}</strong>
            <small>Unique medicines</small>
          </div>

          <div className="stat-card">
            <span>Sellable Stock</span>
            <strong>{sellableStock}</strong>
            <small>In-date units only</small>
          </div>

          <div className="stat-card warning">
            <span>Expiring Soon</span>
            <strong>{expiring.length}</strong>
            <small>Within 30 days</small>
          </div>
        </section>


        <section className="content-card">
  <div className="section-header">
    <div>
      <h2>Medicine Stock</h2>
      <p>Current sellable stock by medicine</p>
    </div>
  </div>

  {medicineStock.length === 0 ? (
    <div className="empty-state">
      No sellable medicines available.
    </div>
  ) : (
    <div className="medicine-grid">
      {medicineStock.map((medicine) => (
        <div
          className="medicine-card"
          key={medicine.medicineName}
        >
          <div>
            <strong>{medicine.medicineName}</strong>
            <span>
              {medicine.batches} active batch
              {medicine.batches !== 1 ? "es" : ""}
            </span>
          </div>

          <div className="medicine-stock">
            <strong>{medicine.sellableStock}</strong>
            <span>units</span>
          </div>
        </div>
      ))}
    </div>
  )}
</section>

        <section className="content-card">
          <div className="section-header">
            <div>
              <h2>Inventory</h2>
              <p>All medicine batches and their expiry status</p>
            </div>

            <input
              className="search"
              type="text"
              placeholder="Search medicine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="empty-state">Loading inventory...</div>
          ) : batches.length === 0 ? (
            <div className="empty-state">
              No medicine batches found.
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Batch</th>
                    <th>Expiry</th>
                    <th>Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {batches.map((batch) => {
                    const status = getStatus(
                      batch.expiryDate,
                      batch.quantity
                    );

                    return (
                      <tr key={batch._id}>
                        <td className="medicine-name">
                          {batch.medicineName}
                        </td>

                        <td>{batch.batchNumber}</td>

                        <td>{formatDate(batch.expiryDate)}</td>

                        <td>{batch.quantity}</td>

                        <td>
                          <span className={`badge ${status}`}>
                            {status === "in-date"
                            ? "In Date"
                            : status === "expiring"
                            ? "Expiring Soon"
                            : status === "out-of-stock"
                            ? "Out of Stock"
                            : "Expired"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="content-card">
          <div className="section-header">
            <div>
              <h2>Expiry Alerts</h2>
              <p>Batches expiring within the next 30 days</p>
            </div>
          </div>

          {expiring.length === 0 ? (
            <div className="empty-state">
              No batches are expiring soon.
            </div>
          ) : (
            <div className="alerts">
              {expiring.map((batch) => (
                <div className="alert-item" key={batch._id}>
                  <div>
                    <strong>{batch.medicineName}</strong>
                    <span>
                      Batch {batch.batchNumber} ·{" "}
                      {batch.quantity} units
                    </span>
                  </div>

                  <div className="expiry-date">
                    {formatDate(batch.expiryDate)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Add Medicine Batch</h2>
                <p>Enter the batch details</p>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowAdd(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={submitBatch}>
              <label>
                Medicine Name
                <input
                  required
                  value={batchForm.medicineName}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      medicineName: e.target.value,
                    })
                  }
                  placeholder="e.g. Paracetamol"
                />
              </label>

              <label>
                Batch Number
                <input
                  required
                  value={batchForm.batchNumber}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      batchNumber: e.target.value,
                    })
                  }
                  placeholder="e.g. PAR001"
                />
              </label>

              <label>
                Expiry Date
                <input
                  required
                  type="date"
                  value={batchForm.expiryDate}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      expiryDate: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Quantity
                <input
                  required
                  min="1"
                  type="number"
                  value={batchForm.quantity}
                  onChange={(e) =>
                    setBatchForm({
                      ...batchForm,
                      quantity: e.target.value,
                    })
                  }
                  placeholder="e.g. 50"
                />
              </label>

              <button className="primary-btn full" type="submit">
                Add Batch
              </button>
            </form>
          </div>
        </div>
      )}

      {showDispense && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Dispense Medicine</h2>
                <p>
                  Stock will automatically follow FEFO order
                </p>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowDispense(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={submitDispense}>
              <label>
                Medicine Name
                <input
                  required
                  value={dispenseForm.medicineName}
                  onChange={(e) =>
                    setDispenseForm({
                      ...dispenseForm,
                      medicineName: e.target.value,
                    })
                  }
                  placeholder="e.g. Paracetamol"
                />
              </label>

              <label>
                Quantity
                <input
                  required
                  min="1"
                  type="number"
                  value={dispenseForm.quantity}
                  onChange={(e) =>
                    setDispenseForm({
                      ...dispenseForm,
                      quantity: e.target.value,
                    })
                  }
                  placeholder="e.g. 10"
                />
              </label>

              <div className="fefo-note">
                <strong>FEFO enabled</strong>
                <span>
                  Earliest valid expiry batch will be used first.
                  Expired batches are never dispensed.
                </span>
              </div>

              <button className="primary-btn full" type="submit">
                Dispense Medicine
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;