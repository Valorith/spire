package spa

import (
    "fmt"
    "github.com/gobuffalo/packr"
)

func TestPath() {
    box := packr.NewBox("../../../frontend/dist/")
    
    // Test WITH leading slash (what the middleware sends)
    data, err := box.Find("/js/chunk-7db4004c.a83a686f.js")
    if err != nil {
        fmt.Println("With /: ERROR:", err)
    } else {
        fmt.Printf("With /: Found! Size: %d\n", len(data))
    }
    
    // Without leading slash
    data, err = box.Find("js/chunk-7db4004c.a83a686f.js")
    if err != nil {
        fmt.Println("Without /: ERROR:", err)
    } else {
        fmt.Printf("Without /: Found! Size: %d\n", len(data))
    }
}
