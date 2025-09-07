# Clean code

The main purpose of refactoring is to fight technical debt. It transforms a mess into clean code and simple design.

Nice! But what’s clean code, anyway? Here are some of its features:
Clean code is obvious for other programmers.

And I’m not talking about super sophisticated algorithms. Poor variable naming, bloated classes and methods, magic numbers -you name it- all of that makes code sloppy and difficult to grasp.
Clean code doesn’t contain duplication.

Each time you have to make a change in a duplicate code, you have to remember to make the same change to every instance. This increases the cognitive load and slows down the progress.
Clean code contains a minimal number of classes and other moving parts.

Less code is less stuff to keep in your head. Less code is less maintenance. Less code is fewer bugs. Code is liability, keep it short and simple.
Clean code passes all tests.

You know your code is dirty when only 95% of your tests passed. You know you’re screwed when your test coverage is 0%.
Clean code is easier and cheaper to maintain!

# When to refactor
Rule of Three

    When you’re doing something for the first time, just get it done.

    When you’re doing something similar for the second time, cringe at having to repeat but do the same thing anyway.

    When you’re doing something for the third time, start refactoring.

When adding a feature

    Refactoring helps you understand other people’s code. If you have to deal with someone else’s dirty code, try to refactor it first. Clean code is much easier to grasp. You will improve it not only for yourself but also for those who use it after you.

    Refactoring makes it easier to add new features. It’s much easier to make changes in clean code.

When fixing a bug

Bugs in code behave just like those in real life: they live in the darkest, dirtiest places in the code. Clean your code and the errors will practically discover themselves.

Managers appreciate proactive refactoring as it eliminates the need for special refactoring tasks later. Happy bosses make happy programmers!
During a code review

The code review may be the last chance to tidy up the code before it becomes available to the public.

It’s best to perform such reviews in a pair with an author. This way you could fix simple problems quickly and gauge the time for fixing the more difficult ones.

# How to refactor

Refactoring should be done as a series of small changes, each of which makes the existing code slightly better while still leaving the program in working order.

# Checklist of refactoring done right way
The code should become cleaner.

If the code remains just as unclean after refactoring... well, I’m sorry, but you’ve just wasted an hour of your life. Try to figure out why this happened.

It frequently happens when you move away from refactoring with small changes and mix a whole bunch of refactorings into one big change. So it’s very easy to lose your mind, especially if you have a time limit.

But it can also happen when working with extremely sloppy code. Whatever you improve, the code as a whole remains a disaster.

In this case, it’s worthwhile to think about completely rewriting parts of the code. But before that, you should have written tests and set aside a good chunk of time. Otherwise, you’ll end up with the kinds of results we talked about in the first paragraph.
New functionality shouldn’t be created during refactoring.

Don’t mix refactoring and direct development of new features. Try to separate these processes at least within the confines of individual commits.
All existing tests must pass after refactoring.

There are two cases when tests can break down after refactoring:

    You made an error during refactoring. This one is a no-brainer: go ahead and fix the error.

    Your tests were too low-level. For example, you were testing private methods of classes.

    In this case, the tests are to blame. You can either refactor the tests themselves or write an entirely new set of higher-level tests. A great way to avoid this kind of a situation is to write BDD-style tests.

# Bloaters

Bloaters are code, methods and classes that have increased to such gargantuan proportions that they’re hard to work with. Usually these smells don’t crop up right away, rather they accumulate over time as the program evolves (and especially when nobody makes an effort to eradicate them).

- Long Method

A method contains too many lines of code. Generally, any method longer than ten lines should make you start asking questions.

## Treatment

As a rule of thumb, if you feel the need to comment on something inside a method, you should take this code and put it in a new method. Even a single line can and should be split off into a separate method, if it requires explanations. And if the method has a descriptive name, nobody will need to look at the code to see what it does.

    To reduce the length of a method body, use Extract Method.

    If local variables and parameters interfere with extracting a method, use Replace Temp with Query, Introduce Parameter Object or Preserve Whole Object.

    If none of the previous recipes help, try moving the entire method to a separate object via Replace Method with Method Object.

    Conditional operators and loops are a good clue that code can be moved to a separate method. For conditionals, use Decompose Conditional. If loops are in the way, try Extract Method.

## Payoff

    Among all types of object-oriented code, classes with short methods live longest. The longer a method or function is, the harder it becomes to understand and maintain it.

    In addition, long methods offer the perfect hiding place for unwanted duplicate code.

Performance

Does an increase in the number of methods hurt performance, as many people claim? In almost all cases the impact is so negligible that it’s not even worth worrying about.

Plus, now that you have clear and understandable code, you’re more likely to find truly effective methods for restructuring code and getting real performance gains if the need ever arises.


- Large Class

A class contains many fields/methods/lines of code.
Primitive Obsession

    Use of primitives instead of small objects for simple tasks (such as currency, ranges, special strings for phone numbers, etc.)
    Use of constants for coding information (such as a constant USER_ADMIN_ROLE = 1 for referring to users with administrator rights.)
    Use of string constants as field names for use in data arrays.

## Treatment

When a class is wearing too many (functional) hats, think about splitting it up:

    Extract Class helps if part of the behavior of the large class can be spun off into a separate component.

    Extract Subclass helps if part of the behavior of the large class can be implemented in different ways or is used in rare cases.

    Extract Interface helps if it’s necessary to have a list of the operations and behaviors that the client can use.

    If a large class is responsible for the graphical interface, you may try to move some of its data and behavior to a separate domain object. In doing so, it may be necessary to store copies of some data in two places and keep the data consistent. Duplicate Observed Data offers a way to do this.

## Payoff

    Refactoring of these classes spares developers from needing to remember a large number of attributes for a class.

    In many cases, splitting large classes into parts avoids duplication of code and functionality.


- Long Parameter List

More than three or four parameters for a method.

## Treatment

    Check what values are passed to parameters. If some of the arguments are just results of method calls of another object, use Replace Parameter with Method Call. This object can be placed in the field of its own class or passed as a method parameter.

    Instead of passing a group of data received from another object as parameters, pass the object itself to the method, by using Preserve Whole Object.

    But if these parameters are coming from different sources, you can pass them as a single parameter object via Introduce Parameter Object.

## Payoff

    More readable, shorter code.

    Refactoring may reveal previously unnoticed duplicate code.

## When to Ignore

    Don’t get rid of parameters if doing so would cause unwanted dependency between classes.

- Data Clumps

Sometimes different parts of the code contain identical groups of variables (such as parameters for connecting to a database). These clumps should be turned into their own classes.

## Reasons for the Problem

Often these data groups are due to poor program structure or "copypasta programming”.

If you want to make sure whether or not some data is a data clump, just delete one of the data values and see whether the other values still make sense. If this isn’t the case, this is a good sign that this group of variables should be combined into an object.
## Treatment

    If repeating data comprises the fields of a class, use Extract Class to move the fields to their own class.

    If the same data clumps are passed in the parameters of methods, use Introduce Parameter Object to set them off as a class.

    If some of the data is passed to other methods, think about passing the entire data object to the method instead of just individual fields. Preserve Whole Object will help with this.

    Look at the code used by these fields. It may be a good idea to move this code to a data class.

## Payoff

    Improves understanding and organization of code. Operations on particular data are now gathered in a single place, instead of haphazardly throughout the code.

    Reduces code size.

## When to Ignore

    Passing an entire object in the parameters of a method, instead of passing just its values (primitive types), may create an undesirable dependency between the two classes.

# Object-Orientation Abusers

All these smells are incomplete or incorrect application of object-oriented programming principles.

- Switch Statements

You have a complex switch operator or sequence of if statements.

## Treatment

    To isolate switch and put it in the right class, you may need Extract Method and then Move Method.

    If a switch is based on type code, such as when the program’s runtime mode is switched, use Replace Type Code with Subclasses or Replace Type Code with State/Strategy.

    After specifying the inheritance structure, use Replace Conditional with Polymorphism.

    If there aren’t too many conditions in the operator and they all call same method with different parameters, polymorphism will be superfluous. If this case, you can break that method into multiple smaller methods with Replace Parameter with Explicit Methods and change the switch accordingly.

    If one of the conditional options is null, use Introduce Null Object.

## Payoff

    Improved code organization.


- Temporary Field

Temporary fields get their values (and thus are needed by objects) only under certain circumstances. Outside of these circumstances, they’re empty.

## Treatment

    Temporary fields and all code operating on them can be put in a separate class via Extract Class. In other words, you’re creating a method object, achieving the same result as if you would perform Replace Method with Method Object.

    Introduce Null Object and integrate it in place of the conditional code which was used to check the temporary field values for existence.

## Payoff

    Better code clarity and organization.

- Refused Bequest

If a subclass uses only some of the methods and properties inherited from its parents, the hierarchy is off-kilter. The unneeded methods may simply go unused or be redefined and give off exceptions.

## Treatment

    If inheritance makes no sense and the subclass really does have nothing in common with the superclass, eliminate inheritance in favor of Replace Inheritance with Delegation.

    If inheritance is appropriate, get rid of unneeded fields and methods in the subclass. Extract all fields and methods needed by the subclass from the parent class, put them in a new superclass, and set both classes to inherit from it (Extract Superclass).

## Payoff

    Improves code clarity and organization. You will no longer have to wonder why the Dog class is inherited from the Chair class (even though they both have 4 legs).

- Alternative Classes with Different Interfaces

Two classes perform identical functions but have different method names.

## Treatment

Try to put the interface of classes in terms of a common denominator:

    Rename Methods to make them identical in all alternative classes.

    Move Method, Add Parameter and Parameterize Method to make the signature and implementation of methods the same.

    If only part of the functionality of the classes is duplicated, try using Extract Superclass. In this case, the existing classes will become subclasses.

    After you have determined which ## Treatment method to use and implemented it, you may be able to delete one of the classes.

## Payoff

    You get rid of unnecessary duplicated code, making the resulting code less bulky.

    Code becomes more readable and understandable (you no longer have to guess the reason for creation of a second class performing the exact same functions as the first one).

## When to Ignore

    Sometimes merging classes is impossible or so difficult as to be pointless. One example is when the alternative classes are in different libraries that each have their own version of the class.


# Change Preventers

These smells mean that if you need to change something in one place in your code, you have to make many changes in other places too. Program development becomes much more complicated and expensive as a result.
1) Divergent Change

You find yourself having to change many unrelated methods when you make changes to a class. For example, when adding a new product type you have to change the methods for finding, displaying, and ordering products.

## Signs and Symptoms

You find yourself having to change many unrelated methods when you make changes to a class. For example, when adding a new product type you have to change the methods for finding, displaying, and ordering products.
## Reasons for the Problem

Often these divergent modifications are due to poor program structure or "copypasta programming”.
## Treatment

    Split up the behavior of the class via Extract Class.

    If different classes have the same behavior, you may want to combine the classes through inheritance (Extract Superclass and Extract Subclass).

## Payoff

    Improves code organization.

    Reduces code duplication.

    Simplifies support.

2) Shotgun Surgery

Making any modifications requires that you make many small changes to many different classes.

## Signs and Symptoms

Making any modifications requires that you make many small changes to many different classes.
## Reasons for the Problem

A single responsibility has been split up among a large number of classes. This can happen after overzealous application of Divergent Change.
## Treatment

    Use Move Method and Move Field to move existing class behaviors into a single class. If there’s no class appropriate for this, create a new one.

    If moving code to the same class leaves the original classes almost empty, try to get rid of these now-redundant classes via Inline Class.

## Payoff

    Better organization.

    Less code duplication.

    Easier maintenance.

3) Parallel Inheritance Hierarchies

Whenever you create a subclass for a class, you find yourself needing to create a subclass for another class.

## Signs and Symptoms

Whenever you create a subclass for a class, you find yourself needing to create a subclass for another class.
## Reasons for the Problem

All was well as long as the hierarchy stayed small. But with new classes being added, making changes has become harder and harder.
## Treatment

    You may de-duplicate parallel class hierarchies in two steps. First, make instances of one hierarchy refer to instances of another hierarchy. Then, remove the hierarchy in the referred class, by using Move Method and Move Field.

## Payoff

    Reduces code duplication.

    Can improve organization of code.

## When to Ignore

    Sometimes having parallel class hierarchies is just a way to avoid even bigger mess with program architecture. If you find that your attempts to de-duplicate hierarchies produce even uglier code, just step out, revert all of your changes and get used to that code.

# Dispensables

A dispensable is something pointless and unneeded whose absence would make the code cleaner, more efficient and easier to understand.
- Comments

A method is filled with explanatory comments.

## Treatment

    If a comment is intended to explain a complex expression, the expression should be split into understandable subexpressions using Extract Variable.

    If a comment explains a section of code, this section can be turned into a separate method via Extract Method. The name of the new method can be taken from the comment text itself, most likely.

    If a method has already been extracted, but comments are still necessary to explain what the method does, give the method a self-explanatory name. Use Rename Method for this.

    If you need to assert rules about a state that’s necessary for the system to work, use Introduce Assertion.

## Payoff

    Code becomes more intuitive and obvious.

## When to Ignore

Comments can sometimes be useful:

    When explaining why something is being implemented in a particular way.

    When explaining complex algorithms (when all other methods for simplifying the algorithm have been tried and come up short).

- Duplicate Code

Two code fragments look almost identical.

## Treatment

    If the same code is found in two or more methods in the same class: use Extract Method and place calls for the new method in both places.

    If the same code is found in two subclasses of the same level:

        Use Extract Method for both classes, followed by Pull Up Field for the fields used in the method that you’re pulling up.

        If the duplicate code is inside a constructor, use Pull Up Constructor Body.

        If the duplicate code is similar but not completely identical, use Form Template Method.

        If two methods do the same thing but use different algorithms, select the best algorithm and apply Substitute Algorithm.

    If duplicate code is found in two different classes:

        If the classes aren’t part of a hierarchy, use Extract Superclass in order to create a single superclass for these classes that maintains all the previous functionality.

        If it’s difficult or impossible to create a superclass, use Extract Class in one class and use the new component in the other.

    If a large number of conditional expressions are present and perform the same code (differing only in their conditions), merge these operators into a single condition using Consolidate Conditional Expression and use Extract Method to place the condition in a separate method with an easy-to-understand name.

    If the same code is performed in all branches of a conditional expression: place the identical code outside of the condition tree by using Consolidate Duplicate Conditional Fragments.

## Payoff

    Merging duplicate code simplifies the structure of your code and makes it shorter.

    Simplification + shortness = code that’s easier to simplify and cheaper to support.

## When to Ignore

    In very rare cases, merging two identical fragments of code can make the code less intuitive and obvious.

- Lazy Class

Understanding and maintaining classes always costs time and money. So if a class doesn’t do enough to earn your attention, it should be deleted.

## Treatment

    Components that are near-useless should be given the Inline Class ## Treatment.

    For subclasses with few functions, try Collapse Hierarchy.

## Payoff

    Reduced code size.

    Easier maintenance.

## When to Ignore

    Sometimes a Lazy Class is created in order to delineate intentions for future development, In this case, try to maintain a balance between clarity and simplicity in your code.

- Data Class

A data class refers to a class that contains only fields and crude methods for accessing them (getters and setters). These are simply containers for data used by other classes. These classes don’t contain any additional functionality and can’t independently operate on the data that they own.

## Treatment

    If a class contains public fields, use Encapsulate Field to hide them from direct access and require that access be performed via getters and setters only.

    Use Encapsulate Collection for data stored in collections (such as arrays).

    Review the client code that uses the class. In it, you may find functionality that would be better located in the data class itself. If this is the case, use Move Method and Extract Method to migrate this functionality to the data class.

    After the class has been filled with well thought-out methods, you may want to get rid of old methods for data access that give overly broad access to the class data. For this, Remove Setting Method and Hide Method may be helpful.

## Payoff

    Improves understanding and organization of code. Operations on particular data are now gathered in a single place, instead of haphazardly throughout the code.

    Helps you to spot duplication of client code.

- Dead Code
A variable, parameter, field, method or class is no longer used (usually because it’s obsolete).

## Treatment

The quickest way to find dead code is to use a good IDE.

    Delete unused code and unneeded files.

    In the case of an unnecessary class, Inline Class or Collapse Hierarchy can be applied if a subclass or superclass is used.

    To remove unneeded parameters, use Remove Parameter.

## Payoff

    Reduced code size.

    Simpler support.

- Speculative Generality

There’s an unused class, method, field or parameter.
## Treatment

    For removing unused abstract classes, try Collapse Hierarchy.

    Unnecessary delegation of functionality to another class can be eliminated via Inline Class.

    Unused methods? Use Inline Method to get rid of them.

    Methods with unused parameters should be given a look with the help of Remove Parameter.

    Unused fields can be simply deleted.

## Payoff

    Slimmer code.

    Easier support.

## When to Ignore

    If you’re working on a framework, it’s eminently reasonable to create functionality not used in the framework itself, as long as the functionality is needed by the frameworks’s users.

    Before deleting elements, make sure that they aren’t used in unit tests. This happens if tests need a way to get certain internal information from a class or perform special testing-related actions.


# Couplers

All the smells in this group contribute to excessive coupling between classes or show what happens if coupling is replaced by excessive delegation.

1) Feature Envy

A method accesses the data of another object more than its own data.

## Reasons for the Problem

This smell may occur after fields are moved to a data class. If this is the case, you may want to move the operations on data to this class as well.
## Treatment

As a basic rule, if things change at the same time, you should keep them in the same place. Usually data and functions that use this data are changed together (although exceptions are possible).

    If a method clearly should be moved to another place, use Move Method.

    If only part of a method accesses the data of another object, use Extract Method to move the part in question.

    If a method uses functions from several other classes, first determine which class contains most of the data used. Then place the method in this class along with the other data. Alternatively, use Extract Method to split the method into several parts that can be placed in different places in different classes.

## Payoff

    Less code duplication (if the data handling code is put in a central place).

    Better code organization (methods for handling data are next to the actual data).

## When to Ignore

    Sometimes behavior is purposefully kept separate from the class that holds the data. The usual advantage of this is the ability to dynamically change the behavior (see Strategy, Visitor and other patterns).

2) Inappropriate Intimacy

One class uses the internal fields and methods of another class.

## Reasons for the Problem

Keep a close eye on classes that spend too much time together. Good classes should know as little about each other as possible. Such classes are easier to maintain and reuse.
## Treatment

    The simplest solution is to use Move Method and Move Field to move parts of one class to the class in which those parts are used. But this works only if the first class truly doesn’t need these parts.

    Another solution is to use Extract Class and Hide Delegate on the class to make the code relations “official”.

    If the classes are mutually interdependent, you should use Change Bidirectional Association to Unidirectional.

    If this “intimacy” is between a subclass and the superclass, consider Replace Delegation with Inheritance.

## Payoff

    Improves code organization.

    Simplifies support and code reuse.

3) Message Chains

In code you see a series of calls resembling $a->b()->c()->d()

## Reasons for the Problem

A message chain occurs when a client requests another object, that object requests yet another one, and so on. These chains mean that the client is dependent on navigation along the class structure. Any changes in these relationships require modifying the client.
## Treatment

    To delete a message chain, use Hide Delegate.

    Sometimes it’s better to think of why the end object is being used. Perhaps it would make sense to use Extract Method for this functionality and move it to the beginning of the chain, by using Move Method.

## Payoff

    Reduces dependencies between classes of a chain.

    Reduces the amount of bloated code.

## When to Ignore

    Overly aggressive delegate hiding can cause code in which it’s hard to see where the functionality is actually occurring. Which is another way of saying, avoid the Middle Man smell as well.

4) Middle Man

If a class performs only one action, delegating work to another class, why does it exist at all?

## Reasons for the Problem

This smell can be the result of overzealous elimination of Message Chains.

In other cases, it can be the result of the useful work of a class being gradually moved to other classes. The class remains as an empty shell that doesn’t do anything other than delegate.
## Treatment

    If most of a method’s classes delegate to another class, Remove Middle Man is in order.

## Payoff

    Less bulky code.

## When to Ignore

Don’t delete middle man that have been created for a reason:

    A middle man may have been added to avoid interclass dependencies.

    Some design patterns create middle man on purpose (such as Proxy or Decorator).

# Other Smells

Below are the smells which don’t fall into any broad category.

- Incomplete Library Class

Sooner or later, libraries stop meeting user needs. The only solution to the problem—changing the library—is often impossible since the library is read-only.

## Reasons for the Problem

The author of the library hasn’t provided the features you need or has refused to implement them.
## Treatment

    To introduce a few methods to a library class, use Introduce Foreign Method.

    For big changes in a class library, use Introduce Local Extension.

## Payoff

    Reduces code duplication (instead of creating your own library from scratch, you can still piggy-back off an existing one).

## When to Ignore

    Extending a library can generate additional work if the changes to the library involve changes in code.

# Refactoring Techniques
## Composing Methods

Much of refactoring is devoted to correctly composing methods. In most cases, excessively long methods are the root of all evil. The vagaries of code inside these methods conceal the execution logic and make the method extremely hard to understand—and even harder to change.

The refactoring techniques in this group streamline methods, remove code duplication, and pave the way for future improvements.

    Extract Method
    Inline Method
    Extract Variable
    Inline Temp

    Replace Temp with Query
    Split Temporary Variable
    Remove Assignments to Parameters

    Replace Method with Method Object
    Substitute Algorithm

Composing Methods

Much of refactoring is devoted to correctly composing methods. In most cases, excessively long methods are the root of all evil. The vagaries of code inside these methods conceal the execution logic and make the method extremely hard to understand—and even harder to change.

The refactoring techniques in this group streamline methods, remove code duplication, and pave the way for future improvements.
Extract Method

### Problem: 
You have a code fragment that can be grouped together.

### Solution: 
Move this code to a separate new method (or function) and replace the old code with a call to the method.
Inline Method

### Problem: 
When a method body is more obvious than the method itself, use this technique.

### Solution: 
Replace calls to the method with the method’s content and delete the method itself.
Extract Variable

### Problem: 
You have an expression that’s hard to understand.

### Solution: 
Place the result of the expression or its parts in separate variables that are self-explanatory.
Inline Temp

### Problem: 
You have a temporary variable that’s assigned the result of a simple expression and nothing more.

### Solution: 
Replace the references to the variable with the expression itself.
Replace Temp with Query

### Problem: 
You place the result of an expression in a local variable for later use in your code.

### Solution: 
Move the entire expression to a separate method and return the result from it. Query the method instead of using a variable. Incorporate the new method in other methods, if necessary.
Split Temporary Variable

### Problem: 
You have a local variable that’s used to store various intermediate values inside a method (except for cycle variables).

### Solution: 
Use different variables for different values. Each variable should be responsible for only one particular thing.
Remove Assignments to Parameters

### Problem: 
Some value is assigned to a parameter inside method’s body.

### Solution: 
Use a local variable instead of a parameter.
Replace Method with Method Object

### Problem: 
You have a long method in which the local variables are so intertwined that you can’t apply Extract Method.

### Solution: 
Transform the method into a separate class so that the local variables become fields of the class. Then you can split the method into several methods within the same class.
Substitute Algorithm

### Problem: 
So you want to replace an existing algorithm with a new one?

### Solution: 
Replace the body of the method that implements the algorithm with a new algorithm.

## Moving Features between Objects

Even if you have distributed functionality among different classes in a less-than-perfect way, there is still hope.

These refactoring techniques show how to safely move functionality between classes, create new classes, and hide implementation details from public access.

    Move Method
    Move Field
    Extract Class
    Inline Class

    Hide Delegate
    Remove Middle Man

    Introduce Foreign Method
    Introduce Local Extension

Moving Features between Objects

Even if you have distributed functionality among different classes in a less-than-perfect way, there’s still hope.

These refactoring techniques show how to safely move functionality between classes, create new classes, and hide implementation details from public access.
Move Method

### Problem: 
A method is used more in another class than in its own class.

### Solution: 
Create a new method in the class that uses the method the most, then move code from the old method to there. Turn the code of the original method into a reference to the new method in the other class or else remove it entirely.
Move Field

### Problem: 
A field is used more in another class than in its own class.

### Solution: 
Create a field in a new class and redirect all users of the old field to it.
Extract Class

### Problem: 
When one class does the work of two, awkwardness results.

### Solution: 
Instead, create a new class and place the fields and methods responsible for the relevant functionality in it.
Inline Class

### Problem: 
A class does almost nothing and isn’t responsible for anything, and no additional responsibilities are planned for it.

### Solution: 
Move all features from the class to another one.
Hide Delegate

### Problem: 
The client gets object B from a field or method of object А. Then the client calls a method of object B.

### Solution: 
Create a new method in class A that delegates the call to object B. Now the client doesn’t know about, or depend on, class B.
Remove Middle Man

### Problem: 
A class has too many methods that simply delegate to other objects.

### Solution: 
Delete these methods and force the client to call the end methods directly.
Introduce Foreign Method

### Problem: 
A utility class doesn’t contain the method that you need and you can’t add the method to the class.

### Solution: 
Add the method to a client class and pass an object of the utility class to it as an argument.
Introduce Local Extension

### Problem: 
A utility class doesn’t contain some methods that you need. But you can’t add these methods to the class.

### Solution: 
Create a new class containing the methods and make it either the child or wrapper of the utility class.

## Organizing Data

These refactoring techniques help with data handling, replacing primitives with rich class functionality. Another important result is untangling of class associations, which makes classes more portable and reusable.

    Change Value to Reference
    Change Reference to Value
    Duplicate Observed Data
    Self Encapsulate Field
    Replace Data Value with Object
    Replace Array with Object

    Change Unidirectional Association to Bidirectional
    Change Bidirectional Association to Unidirectional
    Encapsulate Field
    Encapsulate Collection
    Replace Magic Number with Symbolic Constant

    Replace Type Code with Class
    Replace Type Code with Subclasses
    Replace Type Code with State/Strategy
    Replace Subclass with Fields

Organizing Data

These refactoring techniques help with data handling, replacing primitives with rich class functionality.

Another important result is untangling of class associations, which makes classes more portable and reusable.
Self Encapsulate Field

### Problem: 
You use direct access to private fields inside a class.

### Solution: 
Create a getter and setter for the field, and use only them for accessing the field.
Replace Data Value with Object

### Problem: 
A class (or group of classes) contains a data field. The field has its own behavior and associated data.

### Solution: 
Create a new class, place the old field and its behavior in the class, and store the object of the class in the original class.
Change Value to Reference

### Problem: 
So you have many identical instances of a single class that you need to replace with a single object.

### Solution: 
Convert the identical objects to a single reference object.
Change Reference to Value

### Problem: 
You have a reference object that’s too small and infrequently changed to justify managing its life cycle.

### Solution: 
Turn it into a value object.
Replace Array with Object

### Problem: 
You have an array that contains various types of data.

### Solution: 
Replace the array with an object that will have separate fields for each element.
Duplicate Observed Data

### Problem: 
Is domain data stored in classes responsible for the GUI?

### Solution: 
Then it’s a good idea to separate the data into separate classes, ensuring connection and synchronization between the domain class and the GUI.
Change Unidirectional Association to Bidirectional

### Problem: 
You have two classes that each need to use the features of the other, but the association between them is only unidirectional.

### Solution: 
Add the missing association to the class that needs it.
Change Bidirectional Association to Unidirectional

### Problem: 
You have a bidirectional association between classes, but one of the classes doesn’t use the other’s features.

### Solution: 
Remove the unused association.
Replace Magic Number with Symbolic Constant

### Problem: 
Your code uses a number that has a certain meaning to it.

### Solution: 
Replace this number with a constant that has a human-readable name explaining the meaning of the number.
Encapsulate Field

### Problem: 
You have a public field.

### Solution: 
Make the field private and create access methods for it.
Encapsulate Collection

### Problem: 
A class contains a collection field and a simple getter and setter for working with the collection.

### Solution: 
Make the getter-returned value read-only and create methods for adding/deleting elements of the collection.
Replace Type Code with Class

### Problem: 
A class has a field that contains type code. The values of this type aren’t used in operator conditions and don’t affect the behavior of the program.

### Solution: 
Create a new class and use its objects instead of the type code values.
Replace Type Code with Subclasses

### Problem: 
You have a coded type that directly affects program behavior (values of this field trigger various code in conditionals).

### Solution: 
Create subclasses for each value of the coded type. Then extract the relevant behaviors from the original class to these subclasses. Replace the control flow code with polymorphism.
Replace Type Code with State/Strategy

### Problem: 
You have a coded type that affects behavior but you can’t use subclasses to get rid of it.

### Solution: 
Replace type code with a state object. If it’s necessary to replace a field value with type code, another state object is “plugged in”.
Replace Subclass with Fields

### Problem: 
You have subclasses differing only in their (constant-returning) methods.

### Solution: 
Replace the methods with fields in the parent class and delete the subclasses.

## Simplifying Conditional Expressions

Conditionals tend to get more and more complicated in their logic over time, and there are yet more techniques to combat this as well.

    Consolidate Conditional Expression
    Consolidate Duplicate Conditional Fragments
    Decompose Conditional

    Replace Conditional with Polymorphism
    Remove Control Flag
    Replace Nested Conditional with Guard Clauses

    Introduce Null Object
    Introduce Assertion

Simplifying Conditional Expressions

Conditionals tend to get more and more complicated in their logic over time, and there are yet more techniques to combat this as well.
Decompose Conditional

### Problem: 
You have a complex conditional (if-then/else or switch).

### Solution: 
Decompose the complicated parts of the conditional into separate methods: the condition, then and else.
Consolidate Conditional Expression

### Problem: 
You have multiple conditionals that lead to the same result or action.

### Solution: 
Consolidate all these conditionals in a single expression.
Consolidate Duplicate Conditional Fragments

### Problem: 
Identical code can be found in all branches of a conditional.

### Solution: 
Move the code outside of the conditional.
Remove Control Flag

### Problem: 
You have a boolean variable that acts as a control flag for multiple boolean expressions.

### Solution: 
Instead of the variable, use break, continue and return.
Replace Nested Conditional with Guard Clauses

### Problem: 
You have a group of nested conditionals and it’s hard to determine the normal flow of code execution.

### Solution: 
Isolate all special checks and edge cases into separate clauses and place them before the main checks. Ideally, you should have a “flat” list of conditionals, one after the other.
Replace Conditional with Polymorphism

### Problem: 
You have a conditional that performs various actions depending on object type or properties.

### Solution: 
Create subclasses matching the branches of the conditional. In them, create a shared method and move code from the corresponding branch of the conditional to it. Then replace the conditional with the relevant method call. The result is that the proper implementation will be attained via polymorphism depending on the object class.
Introduce Null Object

### Problem: 
Since some methods return null instead of real objects, you have many checks for null in your code.

### Solution: 
Instead of null, return a null object that exhibits the default behavior.
Introduce Assertion

### Problem: 
For a portion of code to work correctly, certain conditions or values must be true.

### Solution: 
Replace these assumptions with specific assertion checks.

## Simplifying Method Calls

These techniques make method calls simpler and easier to understand. This, in turn, simplifies the interfaces for interaction between classes.

    Add Parameter
    Remove Parameter
    Rename Method
    Separate Query from Modifier
    Parameterize Method

    Introduce Parameter Object
    Preserve Whole Object
    Remove Setting Method
    Replace Parameter with Explicit Methods
    Replace Parameter with Method Call

    Hide Method
    Replace Constructor with Factory Method
    Replace Error Code with Exception
    Replace Exception with Test

Simplifying Method Calls

These techniques make method calls simpler and easier to understand. This, in turn, simplifies the interfaces for interaction between classes.
Rename Method

### Problem: 
The name of a method doesn’t explain what the method does.

### Solution: 
Rename the method.
Add Parameter

### Problem: 
A method doesn’t have enough data to perform certain actions.

### Solution: 
Create a new parameter to pass the necessary data.
Remove Parameter

### Problem: 
A parameter isn’t used in the body of a method.

### Solution: 
Remove the unused parameter.
Separate Query from Modifier

### Problem: 
Do you have a method that returns a value but also changes something inside an object?

### Solution: 
Split the method into two separate methods. As you would expect, one of them should return the value and the other one modifies the object.
Parameterize Method

### Problem: 
Multiple methods perform similar actions that are different only in their internal values, numbers or operations.

### Solution: 
Combine these methods by using a parameter that will pass the necessary special value.
Replace Parameter with Explicit Methods

### Problem: 
A method is split into parts, each of which is run depending on the value of a parameter.

### Solution: 
Extract the individual parts of the method into their own methods and call them instead of the original method.
Preserve Whole Object

### Problem: 
You get several values from an object and then pass them as parameters to a method.

### Solution: 
Instead, try passing the whole object.
Replace Parameter with Method Call

### Problem: 
Calling a query method and passing its results as the parameters of another method, while that method could call the query directly.

### Solution: 
Instead of passing the value through a parameter, try placing a query call inside the method body.
Introduce Parameter Object

### Problem: 
Your methods contain a repeating group of parameters.

### Solution: 
Replace these parameters with an object.
Remove Setting Method

### Problem: 
The value of a field should be set only when it’s created, and not change at any time after that.

### Solution: 
So remove methods that set the field’s value.
Hide Method

### Problem: 
A method isn’t used by other classes or is used only inside its own class hierarchy.

### Solution: 
Make the method private or protected.
Replace Constructor with Factory Method

### Problem: 
You have a complex constructor that does something more than just setting parameter values in object fields.

### Solution: 
Create a factory method and use it to replace constructor calls.
Replace Error Code with Exception

### Problem: 
A method returns a special value that indicates an error?

### Solution: 
Throw an exception instead.
Replace Exception with Test

### Problem: 
You throw an exception in a place where a simple test would do the job?

### Solution: 
Replace the exception with a condition test.

## Dealing with Generalization

Abstraction has its own group of refactoring techniques, primarily associated with moving functionality along the class inheritance hierarchy, creating new classes and interfaces, and replacing inheritance with delegation and vice versa.

    Pull Up Field
    Pull Up Method
    Pull Up Constructor Body
    Push Down Field
    Push Down Method

    Extract Subclass
    Extract Superclass
    Extract Interface
    Collapse Hierarchy

    Form Template Method
    Replace Inheritance with Delegation
    Replace Delegation with Inheritance

Dealing with Generalization

Abstraction has its own group of refactoring techniques, primarily associated with moving functionality along the class inheritance hierarchy, creating new classes and interfaces, and replacing inheritance with delegation and vice versa.
Pull Up Field

### Problem: 
Two classes have the same field.

### Solution: 
Remove the field from subclasses and move it to the superclass.
Pull Up Method

### Problem: 
Your subclasses have methods that perform similar work.

### Solution: 
Make the methods identical and then move them to the relevant superclass.
Pull Up Constructor Body

### Problem: 
Your subclasses have constructors with code that’s mostly identical.

### Solution: 
Create a superclass constructor and move the code that’s the same in the subclasses to it. Call the superclass constructor in the subclass constructors.
Push Down Method

### Problem: 
Is behavior implemented in a superclass used by only one (or a few) subclasses?

### Solution: 
Move this behavior to the subclasses.
Push Down Field

### Problem: 
Is a field used only in a few subclasses?

### Solution: 
Move the field to these subclasses.
Extract Subclass

### Problem: 
A class has features that are used only in certain cases.

### Solution: 
Create a subclass and use it in these cases.
Extract Superclass

### Problem: 
You have two classes with common fields and methods.

### Solution: 
Create a shared superclass for them and move all the identical fields and methods to it.
Extract Interface

### Problem: 
Multiple clients are using the same part of a class interface. Another case: part of the interface in two classes is the same.

### Solution: 
Move this identical portion to its own interface.
Collapse Hierarchy

### Problem: 
You have a class hierarchy in which a subclass is practically the same as its superclass.

### Solution: 
Merge the subclass and superclass.
Form Template Method

### Problem: 
Your subclasses implement algorithms that contain similar steps in the same order.

### Solution: 
Move the algorithm structure and identical steps to a superclass, and leave implementation of the different steps in the subclasses.
Replace Inheritance with Delegation

### Problem: 
You have a subclass that uses only a portion of the methods of its superclass (or it’s not possible to inherit superclass data).

### Solution: 
Create a field and put a superclass object in it, delegate methods to the superclass object, and get rid of inheritance.
Replace Delegation with Inheritance

### Problem: 
A class contains many simple methods that delegate to all methods of another class.

### Solution: 
Make the class a delegate inheritor, which makes the delegating methods unnecessary.
