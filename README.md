# URL Checker

A simple Node.js script to check the accessibility of URLs from a file, with concurrency, logging, and resume support.

## Features

- Reads URLs from a text file (`urls.txt` by default)
- Checks each URL (with optional path and normalization)
- Logs results to a file
- Supports concurrent requests (default: 32 at a time)
- Customizable task logic

## Usage

1. **Clone the repository** and navigate to the project folder.

2. **Prepare your URLs file**  
   List one URL per line in `urls.txt` (default file).  
   Example:
   ```
   google.com
   openai.com
   github.com
   ```

3. **Configure the script (optional)**  
  Edit `url-checker.js` to adjust:
  - `filename` — input file (default: `urls.txt`)
  - `maxConcurrentChecks` — max concurrent checks (default: 32)
  - `taskContext` — options like `tail` (extra path), `removeWWW`, and `timeout`

4. **Run the script**
   ```sh
   node url-checker.js
   ```

5. **Check the log file**  
  Results are saved in a `.log` file (e.g., `urls.log`).

## Example

Suppose your `urls.txt` contains:
```
google.com
openai.com
```

With the default settings, the script will check `https://google.com/some-extra-path` and `https://openai.com/some-extra-path` (if `tail` is set in `taskContext`).

## Customization

- **Change concurrency:**  
  Edit `maxConcurrentChecks` in `url-checker.js` to control how many URLs are checked at once.
- **Modify URL processing:**  
  Change the `taskContext` object to adjust the path (`tail`) or whether to remove `www.` from domains.
- **Custom task logic:**  
  Edit `sample-task.js` to change how each URL is checked (e.g., add headers, check for specific content, etc.).

## Troubleshooting

- **No output or log file not created:**
  - Ensure your `urls.txt` file exists and is not empty.
  - Make sure you are running Node.js v18 or newer.
- **Network errors:**
  - Check your internet connection.
  - Some URLs may block automated requests or require special headers.
- **Permission issues:**
  - Make sure you have write permissions in the project directory for log file creation.

## Resuming from Last Operated Line

The script supports resuming tasks from the last operated line in `urls.txt`. If the script is stopped or interrupted, it can continue processing from where it left off, rather than starting over. The last processed line number is stored automatically in a file named `urls.settings.json` (located alongside your `urls.txt`).

This settings file keeps track of your progress, so you can safely resume large or long-running URL checks without losing progress. No manual configuration is required—just re-run the script, and it will pick up from the last saved position using the information in `urls.settings.json`.

## File Structure

- `url-checker.js` — Main entry point
- `urls.txt` — List of URLs to check
- `task.js` — Example task logic
- `urls.settings.json` — Progress tracking for resume support
- `modules/` — Core modules (queue, logger, tools, etc.)

## License

MIT
