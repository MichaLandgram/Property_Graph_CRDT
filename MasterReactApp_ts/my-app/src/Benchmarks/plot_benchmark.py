import json
import matplotlib.pyplot as plt
import os
import sys

def plot_benchmark():
    # Get the directory where the script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, 'benchmark_results.json')
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found. Please run the benchmark first.")
        return

    with open(json_path, 'r') as f:
        json_data = json.load(f)

    if isinstance(json_data, dict) and 'results' in json_data:
        data = json_data['results']
        config = json_data.get('config', {})
        update_rate = config.get('updateRate', 0) * 100
        delete_rate = config.get('deleteRate', 0) * 100
        subtitle = f"Update Rate: {update_rate}%, Deletion Rate: {delete_rate}%"
    else:
        data = json_data
        subtitle = "Legacy format"

    op_counts = [item['opCount'] for item in data]
    
    # Extract data
    v1_sizes = [item['v1']['size'] / 1024 for item in data]  # KB
    v2_sizes = [item['v2']['size'] / 1024 for item in data]  # KB
    v1_snapshot_sizes = [item['v1'].get('snapshotSize', 0) / 1024 for item in data] # KB
    v2_snapshot_sizes = [item['v2'].get('snapshotSize', 0) / 1024 for item in data] # KB
    
    v1_times = [item['v1']['time'] for item in data]
    v2_times = [item['v2']['time'] for item in data]

    # Plot Size
    plt.figure(figsize=(10, 6))
    plt.plot(op_counts, v1_sizes, label='V1 (Nested Maps)')
    plt.plot(op_counts, v2_sizes, label='V2 (Top-Level Maps)')
    plt.plot(op_counts, v1_snapshot_sizes, label='V1 (Snapshot)', linestyle='--')
    plt.plot(op_counts, v2_snapshot_sizes, label='V2 (Snapshot)', linestyle='--')
    
    # Annotate differences
    for i, (v1, v1Snap, v2, v2Snap) in enumerate(zip(v1_sizes, v1_snapshot_sizes, v2_sizes, v2_snapshot_sizes)):
        # Only annotate every 20 nodes
        if op_counts[i] % 20 != 0:
            continue
            
        # Diff V1 vs V2 
        diff = ((v2 - v1) / v1) * 100
        color = 'green' if diff < 0 else 'red'
        plt.annotate(f"{diff:.1f}%", 
                     (op_counts[i], v2), 
                     textcoords="offset points", 
                     xytext=(0, 10), 
                     ha='center', 
                     color=color, 
                     fontsize=9)

        # Annotate Snapshot savings (optional, maybe just for the last point to avoid clutter)
        if i == len(op_counts) - 1:
             diff_snap = ((v2Snap - v2) / v2) * 100
             plt.annotate(f"Snap: {diff_snap:.1f}%", 
                     (op_counts[i], v2Snap), 
                     textcoords="offset points", 
                     xytext=(0, -15), 
                     ha='center', 
                     color='blue', 
                     fontsize=9)

    plt.xlabel('Number of Nodes')
    plt.ylabel('Memory Usage (KB)')
    plt.title(f'Memory Usage vs Node Count (Averaged)\n({subtitle})')
    plt.legend()
    plt.grid(True)
    plt.savefig(os.path.join(script_dir, 'benchmark_memory.png'))
    print(f"Saved {os.path.join(script_dir, 'benchmark_memory.png')}")
    
    # Plot Time
    plt.figure(figsize=(10, 6))
    
    # Calculate time per node (Average Execution Time)
    v1_times_per_node = [t / c for t, c in zip(v1_times, op_counts)]
    v2_times_per_node = [t / c for t, c in zip(v2_times, op_counts)]
    
    plt.plot(op_counts, v1_times_per_node, label='V1 (Nested Maps)')
    plt.plot(op_counts, v2_times_per_node, label='V2 (Top-Level Maps)')

    # Annotate differences
    for i, (v1, v2) in enumerate(zip(v1_times_per_node, v2_times_per_node)):
        # Only annotate every 20 nodes
        if op_counts[i] % 20 != 0:
            continue
            
        if v1 == 0: continue # Avoid division by zero
        diff = ((v2 - v1) / v1) * 100
        color = 'green' if diff < 0 else 'red'
        plt.annotate(f"{diff:.1f}%", 
                     (op_counts[i], v2), 
                     textcoords="offset points", 
                     xytext=(0, 10), 
                     ha='center', 
                     color=color,
                     fontsize=9)

    plt.xlabel('Number of Nodes')
    plt.ylabel('Average Execution Time per Node (ms)')
    plt.title(f'Average Execution Time vs Node Count\n({subtitle})')
    plt.legend()
    plt.grid(True)
    plt.savefig(os.path.join(script_dir, 'benchmark_time.png'))
    print(f"Saved {os.path.join(script_dir, 'benchmark_time.png')}")

if __name__ == "__main__":
    plot_benchmark()
