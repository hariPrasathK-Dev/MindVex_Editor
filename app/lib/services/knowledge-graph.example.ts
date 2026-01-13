/**
 * Example demonstrating how the Knowledge Graph Construction works
 */

// Example 1: Simple Python code
const pythonExample = `
class Calculator:
    def __init__(self):
        self.result = 0
    
    def add(self, x, y):
        self.result = x + y
        return self.result
    
    def multiply(self, x, y):
        self.result = x * y
        return self.result

def main():
    calc = Calculator()
    result1 = calc.add(5, 3)
    result2 = calc.multiply(result1, 2)
    print(f"Result: {result2}")

if __name__ == "__main__":
    main()
`;

// Example 2: Simple Java code
const javaExample = `
import java.util.ArrayList;
import java.util.List;

public class UserManager {
    private List<User> users;
    
    public UserManager() {
        this.users = new ArrayList<>();
    }
    
    public void addUser(User user) {
        this.users.add(user);
    }
    
    public User findUser(String name) {
        for (User user : this.users) {
            if (user.getName().equals(name)) {
                return user;
            }
        }
        return null;
    }
}

class User {
    private String name;
    
    public User(String name) {
        this.name = name;
    }
    
    public String getName() {
        return this.name;
    }
}
`;

/**
 * Expected Knowledge Graph for Python Example:
 *
 * NODES:
 * - /example.py#Calculator (class)
 * - /example.py#__init__ (function)
 * - /example.py#add (function)
 * - /example.py#multiply (function)
 * - /example.py#main (function)
 * - /example.py#module (module)
 *
 * EDGES:
 * - /example.py#main calls /example.py#Calculator
 * - /example.py#main calls /example.py#add
 * - /example.py#main calls /example.py#multiply
 * - /example.py#add calls /example.py#print
 */

/**
 * Expected Knowledge Graph for Java Example:
 *
 * NODES:
 * - /example.java#UserManager (class)
 * - /example.java#User (class)
 * - /example.java#addUser (function)
 * - /example.py#findUser (function)
 * - /example.java#getName (function)
 * - /example.java#module (module)
 *
 * EDGES:
 * - /example.java#import_java.util.ArrayList to module
 * - /example.java#import_java.util.List to module
 * - /example.java#findUser calls /example.java#getName
 */

export { pythonExample, javaExample };
