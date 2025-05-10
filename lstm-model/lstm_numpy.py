import numpy as np
from typing import Tuple, List

class LSTMModel:
    def __init__(self, input_size: int, hidden_size: int):
        """Initialize LSTM parameters"""
        # Input weights
        self.W_i = np.random.randn(hidden_size, input_size) * 0.01
        self.W_f = np.random.randn(hidden_size, input_size) * 0.01
        self.W_o = np.random.randn(hidden_size, input_size) * 0.01
        self.W_c = np.random.randn(hidden_size, input_size) * 0.01
        
        # Recurrent weights
        self.U_i = np.random.randn(hidden_size, hidden_size) * 0.01
        self.U_f = np.random.randn(hidden_size, hidden_size) * 0.01
        self.U_o = np.random.randn(hidden_size, hidden_size) * 0.01
        self.U_c = np.random.randn(hidden_size, hidden_size) * 0.01
        
        # Biases
        self.b_i = np.zeros((hidden_size, 1))
        self.b_f = np.zeros((hidden_size, 1))
        self.b_o = np.zeros((hidden_size, 1))
        self.b_c = np.zeros((hidden_size, 1))
        
        # Output layer weights
        self.W_y = np.random.randn(input_size, hidden_size) * 0.01
        self.b_y = np.zeros((input_size, 1))
        
        # Gradients and cache for backprop
        self.cache = []
        self.gradients = {}
        
        # Store dimensions
        self.input_size = input_size
        self.hidden_size = hidden_size
    
    @staticmethod
    def sigmoid(x: np.ndarray) -> np.ndarray:
        """Sigmoid activation function"""
        return 1 / (1 + np.exp(-x))
    
    @staticmethod
    def tanh(x: np.ndarray) -> np.ndarray:
        """Tanh activation function"""
        return np.tanh(x)
    
    def forward_step(self, x: np.ndarray, h_prev: np.ndarray, c_prev: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Single LSTM forward step"""
        # Input gate
        i = self.sigmoid(np.dot(self.W_i, x) + np.dot(self.U_i, h_prev) + self.b_i)
        
        # Forget gate
        f = self.sigmoid(np.dot(self.W_f, x) + np.dot(self.U_f, h_prev) + self.b_f)
        
        # Output gate
        o = self.sigmoid(np.dot(self.W_o, x) + np.dot(self.U_o, h_prev) + self.b_o)
        
        # Cell state
        c_candidate = self.tanh(np.dot(self.W_c, x) + np.dot(self.U_c, h_prev) + self.b_c)
        c_next = f * c_prev + i * c_candidate
        
        # Hidden state
        h_next = o * self.tanh(c_next)
        
        # Store values for backprop
        self.cache.append((x, h_prev, c_prev, i, f, o, c_candidate, c_next))
        
        return h_next, c_next
    
    def forward(self, X: np.ndarray) -> np.ndarray:
        """Full forward pass through sequence"""
        seq_len = X.shape[0]
        h = np.zeros((self.hidden_size, 1))
        c = np.zeros((self.hidden_size, 1))
        outputs = []
        
        self.cache = []  # Reset cache
        
        for t in range(seq_len):
            x = X[t].reshape(-1, 1)  # Reshape to column vector
            h, c = self.forward_step(x, h, c)
            
            # Compute output
            y = np.dot(self.W_y, h) + self.b_y
            outputs.append(y)
        
        return np.array(outputs).squeeze()
    
    def backward(self, X: np.ndarray, Y: np.ndarray) -> float:
        """Backpropagation Through Time (BPTT)"""
        seq_len = X.shape[0]
        loss = 0
        
        # Initialize gradients
        dW_i = np.zeros_like(self.W_i)
        dW_f = np.zeros_like(self.W_f)
        dW_o = np.zeros_like(self.W_o)
        dW_c = np.zeros_like(self.W_c)
        
        dU_i = np.zeros_like(self.U_i)
        dU_f = np.zeros_like(self.U_f)
        dU_o = np.zeros_like(self.U_o)
        dU_c = np.zeros_like(self.U_c)
        
        db_i = np.zeros_like(self.b_i)
        db_f = np.zeros_like(self.b_f)
        db_o = np.zeros_like(self.b_o)
        db_c = np.zeros_like(self.b_c)
        
        dW_y = np.zeros_like(self.W_y)
        db_y = np.zeros_like(self.b_y)
        
        dh_next = np.zeros((self.hidden_size, 1))
        dc_next = np.zeros((self.hidden_size, 1))
        
        # Backward pass through time
        for t in reversed(range(seq_len)):
            x, h_prev, c_prev, i, f, o, c_candidate, c_next = self.cache[t]
            
            # Output layer gradients
            dy = (self.forward(X)[t] - Y[t]).reshape(-1, 1)
            dW_y += np.dot(dy, h_next.T)
            db_y += dy
            
            # Hidden state gradient
            dh = np.dot(self.W_y.T, dy) + dh_next
            
            # Output gate gradient
            do = dh * self.tanh(c_next)
            do = do * o * (1 - o)
            dW_o += np.dot(do, x.T)
            dU_o += np.dot(do, h_prev.T)
            db_o += do
            
            # Cell state gradient
            dc = dh * o * (1 - self.tanh(c_next)**2) + dc_next
            dc_candidate = dc * i
            dc_candidate = dc_candidate * (1 - c_candidate**2)
            dW_c += np.dot(dc_candidate, x.T)
            dU_c += np.dot(dc_candidate, h_prev.T)
            db_c += dc_candidate
            
            # Input gate gradient
            di = dc * c_candidate
            di = di * i * (1 - i)
            dW_i += np.dot(di, x.T)
            dU_i += np.dot(di, h_prev.T)
            db_i += di
            
            # Forget gate gradient
            df = dc * c_prev
            df = df * f * (1 - f)
            dW_f += np.dot(df, x.T)
            dU_f += np.dot(df, h_prev.T)
            db_f += df
            
            # Update gradients for next step
            dx = (np.dot(self.W_i.T, di) + np.dot(self.W_f.T, df) + 
                  np.dot(self.W_o.T, do) + np.dot(self.W_c.T, dc_candidate))
            
            dh_next = (np.dot(self.U_i.T, di) + np.dot(self.U_f.T, df) + 
                      np.dot(self.U_o.T, do) + np.dot(self.U_c.T, dc_candidate))
            
            dc_next = dc * f
            
            # Compute loss (MSE)
            loss += 0.5 * np.sum(dy**2)
        
        # Store gradients
        self.gradients = {
            'W_i': dW_i, 'W_f': dW_f, 'W_o': dW_o, 'W_c': dW_c,
            'U_i': dU_i, 'U_f': dU_f, 'U_o': dU_o, 'U_c': dU_c,
            'b_i': db_i, 'b_f': db_f, 'b_o': db_o, 'b_c': db_c,
            'W_y': dW_y, 'b_y': db_y
        }
        
        return loss / seq_len
    
    def update_parameters(self, learning_rate: float = 0.01):
        """Update parameters using gradients"""
        for param in ['W_i', 'W_f', 'W_o', 'W_c', 
                     'U_i', 'U_f', 'U_o', 'U_c',
                     'b_i', 'b_f', 'b_o', 'b_c',
                     'W_y', 'b_y']:
            setattr(self, param, getattr(self, param) - learning_rate * self.gradients[param])
    
    def train(self, X: np.ndarray, Y: np.ndarray, 
              epochs: int = 100, learning_rate: float = 0.01,
              verbose: bool = True):
        """Train the LSTM model"""
        losses = []
        for epoch in range(epochs):
            total_loss = 0
            for i in range(len(X)):
                x_seq = X[i]
                y_seq = Y[i]
                
                # Forward pass
                self.forward(x_seq)
                
                # Backward pass
                loss = self.backward(x_seq, y_seq)
                total_loss += loss
                
                # Update parameters
                self.update_parameters(learning_rate)
            
            avg_loss = total_loss / len(X)
            losses.append(avg_loss)
            if verbose and (epoch % 10 == 0 or epoch == epochs - 1):
                print(f"Epoch {epoch + 1}/{epochs}, Loss: {avg_loss:.4f}")
        
        return losses

    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions"""
        return self.forward(X)
    
    def save(self, path: str):
        """Save model parameters"""
        params = {
            'W_i': self.W_i, 'W_f': self.W_f, 'W_o': self.W_o, 'W_c': self.W_c,
            'U_i': self.U_i, 'U_f': self.U_f, 'U_o': self.U_o, 'U_c': self.U_c,
            'b_i': self.b_i, 'b_f': self.b_f, 'b_o': self.b_o, 'b_c': self.b_c,
            'W_y': self.W_y, 'b_y': self.b_y,
            'input_size': self.input_size,
            'hidden_size': self.hidden_size
        }
        np.savez(path, **params)
    
    @classmethod
    def load(cls, path: str):
        """Load model parameters"""
        data = np.load(path, allow_pickle=True)
        model = cls(data['input_size'], data['hidden_size'])
        
        for param in ['W_i', 'W_f', 'W_o', 'W_c', 
                     'U_i', 'U_f', 'U_o', 'U_c',
                     'b_i', 'b_f', 'b_o', 'b_c',
                     'W_y', 'b_y']:
            setattr(model, param, data[param])
        
        return model