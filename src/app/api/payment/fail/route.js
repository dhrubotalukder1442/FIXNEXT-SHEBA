export async function POST(req) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/fail`,
    },
  });
}
