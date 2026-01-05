import json
import matplotlib.pyplot as plt
import os
import sys

def plot_benchmark():
    # Get the directory where the script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = script_dir # Save plots in the same directory
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
    else:
        data = json_data
        update_rate = "N/A"
        delete_rate = "N/A"

    ops = [item['opCount'] for item in data]
    
    # Extract data
    
    # v1 data
    v1_times = [xm['v1']['time'] / xm['opCount'] for xm in data]
    v1_sizes = [xm['v1']['size'] / 1024 for xm in data]
    v1_snapshot_sizes = [xm['v1'].get('snapshotSize', 0) / 1024 for xm in data]

    # v2 data
    v2_times = [xm['v2']['time'] / xm['opCount'] for xm in data]
    v2_sizes = [xm['v2']['size'] / 1024 for xm in data]
    v2_snapshot_sizes = [xm['v2'].get('snapshotSize', 0) / 1024 for xm in data]

    # v3 data
    v3_times = [xm['v3']['time'] / xm['opCount'] for xm in data]
    v3_sizes = [xm['v3']['size'] / 1024 for xm in data]
    v3_snapshot_sizes = [xm['v3'].get('snapshotSize', 0) / 1024 for xm in data]

    # 1) Memory Plot
    plt.figure(figsize=(12, 6))

    # Sizes with History
    plt.plot(ops, v1_sizes, label='V1 (Nested Maps)', marker='o')
    plt.plot(ops, v2_sizes, label='V2 (Top-Level Maps)', marker='x')
    plt.plot(ops, v3_sizes, label='V3 (DualKeyMap)', marker='^', color='green')

    # Snapshot Sizes (Dashed)
    plt.plot(ops, v1_snapshot_sizes, label='V1 (Snapshot)',  linestyle='--', alpha=0.5)
    plt.plot(ops, v2_snapshot_sizes, label='V2 (Snapshot)', linestyle='--', alpha=0.5)
    plt.plot(ops, v3_snapshot_sizes, label='V3 (Snapshot)', linestyle='--', color='lightgreen', alpha=0.5)

    plt.xlabel('Number of Operations (Adds/Updates)')
    plt.ylabel('Document Size (KB)')
    plt.title(f'YJS Memory Footprint\n(Config: DeleteRate={delete_rate}%, UpdateRate={update_rate}%)')
    plt.legend()
    plt.grid(True)

    for i, op in enumerate(ops):
        if i % 10 == 0: # Annotate every 10th point to avoid clutter
            # V2 vs V1
            diff_v2 = ((v2_sizes[i] - v1_sizes[i]) / v1_sizes[i]) * 100
            plt.annotate(f'{diff_v2:+.1f}%', (op, v2_sizes[i]), textcoords="offset points", xytext=(0,10), ha='center', fontsize=8, color='blue')
            
            # V3 vs V1
            diff_v3 = ((v3_sizes[i] - v1_sizes[i]) / v1_sizes[i]) * 100
            plt.annotate(f'{diff_v3:+.1f}%', (op, v3_sizes[i]), textcoords="offset points", xytext=(0,-15), ha='center', fontsize=8, color='green')

    plot_filename = os.path.join(output_dir, f'benchmark_memory.png')
    plt.savefig(plot_filename)
    print(f"Saved memory plot to {plot_filename}")

    # 2) Execution Time Plot
    plt.figure(figsize=(12, 6))
    plt.plot(ops, v1_times, label='V1 (Nested Maps)', marker='o')
    plt.plot(ops, v2_times, label='V2 (Top-Level Maps)', marker='x')
    plt.plot(ops, v3_times, label='V3 (DualKeyMap)', marker='^', color='green')

    plt.xlabel('Number of Operations')
    plt.ylabel('Avg Time per Node (ms)')
    plt.title(f'Execution Time Comparison (Avg per Node)\n(Config: DeleteRate={delete_rate}%, UpdateRate={update_rate}%)')
    plt.legend()
    plt.grid(True)
    
    time_plot_filename = os.path.join(output_dir, f'benchmark_time.png')
    plt.savefig(time_plot_filename)
    print(f"Saved time plot to {time_plot_filename}")

if __name__ == "__main__":
    plot_benchmark()
