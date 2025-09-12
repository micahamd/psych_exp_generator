#!/usr/bin/env python3
"""
Test script to verify the server save functionality implementation
without requiring an actual server setup.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from peg_main import ExperimentGenerator
import tkinter as tk

def test_html_generation():
    """Test that HTML generation works correctly for both checkbox states"""
    
    print("Testing PEG Server Save Implementation...")
    print("=" * 50)
    
    # Create a minimal tkinter root (hidden)
    root = tk.Tk()
    root.withdraw()  # Hide the window
    
    # Create the experiment generator
    app = ExperimentGenerator(root)
    
    # Create some test trials
    test_trials = [
        {
            'block': 1,
            'stimulus': 'Test Stimulus 1',
            'response': 'z,m',
            'latency': 'NA',
            'correct_response': 'z',
            'feedback_text': '[correct] Correct!',
            'feedback_duration': '300',
            'stimulus_color': 'white',
            'background_color': 'black',
            'repetition': 1,
            'block_repetition': 1
        },
        {
            'block': 2,
            'stimulus': 'Test Stimulus 2',
            'response': 'z,m',
            'latency': 'NA',
            'correct_response': 'm',
            'feedback_text': '[correct] Correct!',
            'feedback_duration': '300',
            'stimulus_color': 'white',
            'background_color': 'black',
            'repetition': 1,
            'block_repetition': 1
        }
    ]
    
    # Test 1: Local download mode (checkbox unchecked)
    print("Test 1: Local Download Mode (checkbox unchecked)")
    app.save_to_server_var.set(False)
    html_local = app.generate_html(test_trials)
    
    # Check that local download function is present
    if 'function downloadData()' in html_local and 'fetch(' not in html_local:
        print("✅ Local download mode: PASS - Contains standard downloadData function")
    else:
        print("❌ Local download mode: FAIL - Incorrect function generated")
    
    # Test 2: Server save mode (checkbox checked)
    print("\nTest 2: Server Save Mode (checkbox checked)")
    app.save_to_server_var.set(True)
    html_server = app.generate_html(test_trials)
    
    # Check that server save function is present
    if 'fetch(\'/experiments/save_peg_results.php\'' in html_server and 'downloadDataLocally()' in html_server:
        print("✅ Server save mode: PASS - Contains fetch request and fallback function")
    else:
        print("❌ Server save mode: FAIL - Missing server functionality")
    
    # Test 3: Verify error handling is present
    if 'catch(error =>' in html_server and 'Error saving to server' in html_server:
        print("✅ Error handling: PASS - Contains proper error handling")
    else:
        print("❌ Error handling: FAIL - Missing error handling")
    
    # Test 4: Verify fallback mechanism
    if 'downloadDataLocally();' in html_server:
        print("✅ Fallback mechanism: PASS - Contains fallback to local download")
    else:
        print("❌ Fallback mechanism: FAIL - Missing fallback mechanism")
    
    print("\n" + "=" * 50)
    print("HTML Generation Tests Complete!")
    
    # Save sample HTML files for manual inspection
    with open('test_local_mode.html', 'w', encoding='utf-8') as f:
        f.write(html_local)
    print("📄 Sample local mode HTML saved as: test_local_mode.html")
    
    with open('test_server_mode.html', 'w', encoding='utf-8') as f:
        f.write(html_server)
    print("📄 Sample server mode HTML saved as: test_server_mode.html")
    
    root.destroy()

def test_php_script():
    """Test that the PHP script file was created correctly"""
    print("\nTesting PHP Script Generation...")
    print("=" * 30)
    
    if os.path.exists('save_peg_results.php'):
        print("✅ PHP script file: PASS - save_peg_results.php exists")
        
        with open('save_peg_results.php', 'r') as f:
            content = f.read()
            
        # Check for key features
        checks = [
            ('CORS headers', 'Access-Control-Allow-Origin'),
            ('JSON validation', 'json_decode'),
            ('Error handling', 'http_response_code'),
            ('File saving', 'file_put_contents'),
            ('Directory creation', 'mkdir'),
            ('Required fields validation', 'required_fields')
        ]
        
        for check_name, check_string in checks:
            if check_string in content:
                print(f"✅ {check_name}: PASS")
            else:
                print(f"❌ {check_name}: FAIL")
    else:
        print("❌ PHP script file: FAIL - save_peg_results.php not found")

if __name__ == "__main__":
    test_html_generation()
    test_php_script()
    
    print("\n" + "=" * 50)
    print("NEXT STEPS FOR FULL TESTING:")
    print("1. Upload save_peg_results.php to your web server at /experiments/")
    print("2. Ensure the web server has PHP support")
    print("3. Create /experiment_results/ directory with write permissions")
    print("4. Load flanker_task.csv in the PEG application")
    print("5. Check the 'Save Results to Server (PHP)?' checkbox")
    print("6. Run the experiment and verify results are saved to server")
    print("=" * 50)
