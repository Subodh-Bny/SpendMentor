import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ExpenseTable() {
  const expenses = [
    {
      id: 1,
      date: "2024-03-01",
      description: "Office Supplies",
      category: "Supplies",
      amount: 150.75,
    },
    {
      id: 2,
      date: "2024-03-03",
      description: "Client Lunch",
      category: "Meals",
      amount: 85.2,
    },
    {
      id: 3,
      date: "2024-03-05",
      description: "Software Subscription",
      category: "Software",
      amount: 299.99,
    },
    {
      id: 4,
      date: "2024-03-10",
      description: "Travel Expenses",
      category: "Travel",
      amount: 523.5,
    },
    {
      id: 5,
      date: "2024-03-15",
      description: "Office Rent",
      category: "Rent",
      amount: 2000.0,
    },
  ];

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-4">Expense Report</h2>
      <div className="rounded-md border">
        <Table>
          <TableCaption>A list of your recent expenses.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.date}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {expense.category}
                </TableCell>
                <TableCell className="text-right">
                  ${expense.amount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right font-bold">
                ${total.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
